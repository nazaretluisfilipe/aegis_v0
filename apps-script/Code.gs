/**
 * Recebe os leads do formulário e grava no Google Sheets.
 * A planilha é definida pela propriedade de script SHEET_ID (nenhum segredo fica no código).
 * Para trocar de planilha no futuro: altere SHEET_ID em Configurações do projeto > Propriedades do script.
 */
var HEADERS = ['Recebido em','Responsável','WhatsApp','E-mail','Aluno','Idade','Série/ano','Escola','Disciplinas','Objetivo','Dificuldades','Disponibilidade','Frequência','Observações','Consentimento','Origem'];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (!d.consent || !d.guardianName || !d.whatsapp || !d.studentName) return out({ ok: false, error: 'invalid' });
    var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var sheet = SpreadsheetApp.openById(id).getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    var row = [new Date(), d.guardianName, d.whatsapp, d.email, d.studentName, d.age, d.grade, d.school,
      (d.subjects || []).join(', '), d.goal, d.difficulties, d.availability, d.frequency, d.notes, 'Sim', d.source];
    sheet.appendRow(row.map(safe));
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: 'server' });
  }
}

// Impede injeção de fórmulas: texto iniciado por = + - @ vira texto literal.
function safe(v) {
  if (typeof v !== 'string') return v;
  v = v.slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

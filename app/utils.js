/* TIỆN ÍCH DÙNG CHUNG */
window.fmtTime = (ms) => {
  const s = Math.floor(ms/1000);
  const m = String(Math.floor(s/60)).padStart(2,'0');
  const r = String(s%60).padStart(2,'0');
  return m+':'+r;
};

window.wordsOf = (text) => String(text||'').trim().split(/\s+/).filter(Boolean);

const toneMap = {'á':'sắc','ấ':'sắc','ắ':'sắc','é':'sắc','ế':'sắc','í':'sắc','ó':'sắc','ố':'sắc','ớ':'sắc','ú':'sắc','ứ':'sắc','ý':'sắc',
  'à':'huyền','ầ':'huyền','ằ':'huyền','è':'huyền','ề':'huyền','ì':'huyền','ò':'huyền','ồ':'huyền','ờ':'huyền','ù':'huyền','ừ':'huyền','ỳ':'huyền',
  'ả':'hỏi','ẩ':'hỏi','ẳ':'hỏi','ẻ':'hỏi','ể':'hỏi','ỉ':'hỏi','ỏ':'hỏi','ổ':'hỏi','ở':'hỏi','ủ':'hỏi','ử':'hỏi','ỷ':'hỏi',
  'ã':'ngã','ẫ':'ngã','ẵ':'ngã','ẽ':'ngã','ễ':'ngã','ĩ':'ngã','õ':'ngã','ỗ':'ngã','ỡ':'ngã','ũ':'ngã','ữ':'ngã','ỹ':'ngã',
  'ạ':'nặng','ậ':'nặng','ặ':'nặng','ẹ':'nặng','ệ':'nặng','ị':'nặng','ọ':'nặng','ộ':'nặng','ợ':'nặng','ụ':'nặng','ự':'nặng','ỵ':'nặng' };

window.detectTone = (syll) => {
  for (const ch of String(syll||'')) { if (toneMap[ch]) return toneMap[ch]; }
  return 'ngang';
};
window.toneClass = (syll) => 'tone-' + window.detectTone(syll);

window.download = function(filename, text) {
  const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
};

window.toCSV = function(rows){
  if (!rows || !rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  for(const r of rows){ lines.push(headers.map(h=>esc(r[h])).join(',')); }
  return lines.join('\n');
};
/* MODULE: DASHBOARD */
window.DashboardModule = {
  render(){
    const logs = AppState.logs.filter(x=>x.type==='reading');
    const xs = logs.map(x=> new Date(x.ts).toLocaleDateString());
    const wc = logs.map(x=> x.wcpm);
    const ac = logs.map(x=> +(x.accuracy*100).toFixed(0));
    const du = logs.map(x=> Math.round((x.durationMs||0)/1000));
    const err = logs.reduce((acc, l) => {
      for (const k of ['tone','sx','chtr','omission','insertion','other']){
        acc[k] = (acc[k] || 0) + (l.errorsByType?.[k] || 0);
      } return acc;
    }, {});
    drawLineChart(document.getElementById('chartWCPM'), xs, wc, '#2E7D32', 'WCPM');
    drawLineChart(document.getElementById('chartACC'), xs, ac, '#6A1B9A', '% đúng');
    drawLineChart(document.getElementById('chartDUR'), xs, du, '#1565C0', 'Giây');
    drawLineChart(document.getElementById('chartERR'), Object.keys(err), Object.values(err), '#C62828', 'Tổng lỗi');
    if (window.App) App.updateSyncStatus();
    VoiceUI.attachAll();
  }
};
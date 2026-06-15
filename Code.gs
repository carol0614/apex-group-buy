/**
 * Carol × APEX 團購表單後端
 * ----------------------------------------------------
 * 功能：
 *   1. 接收前端 POST（JSON）
 *   2. 在 Drive 主資料夾下，為每位客戶建立獨立子資料夾
 *   3. 把 base64 照片解碼存到該子資料夾
 *   4. 把訂單寫進 Google Sheet，附上照片資料夾連結
 *
 * 部署步驟見 DEPLOY.md
 */

// ============ 必填設定 ============
const DRIVE_PARENT_FOLDER_ID = '1__WNoszcXcpob2kXLddMHmrgBfDbgbqT'; // Carol 的 APEX-團購-2026 資料夾
const SHEET_ID = '1hap8q1fWLwhsgFa0jfCJK1TET9iREQ15zeXZqF9Yu-M'; // APEX_訂單_2026
const SHEET_NAME = '訂單';
// Digest 通知收件人（多人用逗號分隔；留空陣列則不寄）
const NOTIFY_EMAILS = [
  'carol@goodlivingnotes.com',   // Carol
  'rippleworks2025@gmail.com',   // APEX 廠商
];
const DIGEST_INTERVAL_DAYS = 2;          // 每 N 天整理一次（搭配 setupDigestTrigger() 排程）
const DIGEST_LAST_RUN_KEY = 'DIGEST_LAST_RUN_AT'; // 存在 ScriptProperties 的 key

// ============ 主入口 ============
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 1. 基本驗證
    const validationError = validate(data);
    if (validationError) {
      return jsonResponse({ success: false, error: validationError });
    }

    // 2. 建立客戶專屬資料夾
    const folder = createCustomerFolder(data);
    const folderUrl = folder.getUrl();

    // 3. 上傳照片
    const photoLinks = [];
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo, idx) => {
        try {
          const file = savePhotoToDrive(folder, photo, idx);
          photoLinks.push(file.getUrl());
        } catch (err) {
          console.error('Photo upload failed:', photo.filename, err);
        }
      });
    }

    // 4. 寫入 Sheet
    const { orderNo, totalCount } = appendToSheet(data, folderUrl, photoLinks);

    // 5. 通知改成每兩天 digest 整理（由 setupDigestTrigger 建立的排程觸發 sendDigest），這裡不即時寄信

    return jsonResponse({
      success: true,
      orderNo: orderNo,
      folderUrl: folderUrl,
    });
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ success: false, error: err.message || String(err) });
  }
}

// 健康檢查（部署後可在瀏覽器打開 /exec 看是否正常）
function doGet() {
  return jsonResponse({
    success: true,
    message: 'APEX 團購表單 API 運作中',
    timestamp: new Date().toISOString(),
  });
}

// ============ 驗證 ============
function validate(data) {
  if (!data.name) return '姓名為必填';
  if (!data.phone) return '電話為必填';
  if (!data.lineName) return 'LINE 名稱為必填';
  if (!data.address) return '地址為必填';
  if (!data.model || !['AP100', 'AP100-BLACK', 'AP50'].includes(data.model)) return '型號未選擇';
  if (!data.measureRead) return '請確認已詳閱門扇丈量說明';
  if (!data.noticeRead) return '請確認已詳閱注意事項';
  if (!data.disclaimerRead) return '請確認已詳閱免責聲明';
  return null;
}

// ============ Drive: 建立客戶資料夾 ============
function createCustomerFolder(data) {
  const parent = DriveApp.getFolderById(DRIVE_PARENT_FOLDER_ID);
  const ts = formatDate(new Date(), 'yyyy-MM-dd_HHmm');
  const phoneTail = (data.phone || '').replace(/\D/g, '').slice(-3);
  const safeName = (data.name || 'unknown').replace(/[\\/:*?"<>|]/g, '_');
  const folderName = `${ts}_${safeName}_${phoneTail}`;
  return parent.createFolder(folderName);
}

// ============ Drive: 存照片 ============
function savePhotoToDrive(folder, photo, idx) {
  // photo.dataUrl 格式： "data:image/jpeg;base64,xxxx"
  const dataUrl = photo.dataUrl || '';
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid dataUrl format');
  const mimeType = match[1];
  const base64Data = match[2];
  const bytes = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(bytes, mimeType, photo.filename || `door_${idx+1}.jpg`);
  return folder.createFile(blob);
}

// ============ Sheet: 寫入訂單 ============
function appendToSheet(data, folderUrl, photoLinks) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // 第一次跑時建 header
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '訂單編號', '送出時間', '姓名', '電話', 'LINE 名稱', 'Email', '地址',
      '型號', '型號優惠價', '已詳閱丈量', '已詳閱注意事項', '已詳閱免責聲明',
      '照片資料夾', '照片連結', '照片數', 'User Agent', '處理狀態', '備註'
    ]);
    sheet.setFrozenRows(1);
    // 美化 header
    const headerRange = sheet.getRange(1, 1, 1, 18);
    headerRange.setBackground('#7C837B').setFontColor('#FFFFFF').setFontWeight('bold');
  }

  const lastRow = sheet.getLastRow();
  const orderNo = 'APEX-' + formatDate(new Date(), 'yyyyMMdd') + '-' + String(lastRow).padStart(3, '0');
  const price = (data.model === 'AP100' || data.model === 'AP100-BLACK') ? 33500 : 26000;

  sheet.appendRow([
    orderNo,
    new Date(),
    data.name,
    data.phone,
    data.lineName || '',
    data.email || '',
    data.address,
    data.model,
    price,
    data.measureRead ? '✓' : '',
    data.noticeRead ? '✓' : '',
    data.disclaimerRead ? '✓' : '',
    folderUrl,
    photoLinks.join('\n'),
    photoLinks.length,
    (data.userAgent || '').substring(0, 200),
    '待聯繫',
    '',
  ]);

  return { orderNo: orderNo, totalCount: lastRow };
}

// ============ 通知 Email：每兩天 digest ============
// 由 setupDigestTrigger() 建立的時間驅動 trigger 自動呼叫
// 邏輯：掃 Sheet 找「上次 digest 時間之後」的新訂單；無新訂單 → 不寄
function sendDigest() {
  if (!NOTIFY_EMAILS || NOTIFY_EMAILS.length === 0) return;

  const props = PropertiesService.getScriptProperties();
  const lastRunStr = props.getProperty(DIGEST_LAST_RUN_KEY);
  // 首跑時用「DIGEST_INTERVAL_DAYS 天前」當基準，避免一次撈整顆 Sheet
  const since = lastRunStr
    ? new Date(lastRunStr)
    : new Date(Date.now() - DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    console.log('Digest: 尚無訂單，略過');
    return;
  }

  // 第一列是 header，從第 2 列起讀
  const lastRow = sheet.getLastRow();
  const rows = sheet.getRange(2, 1, lastRow - 1, 18).getValues();

  // 篩出「送出時間 > since」的新訂單；col index：0=訂單編號, 1=送出時間, 2=姓名, 3=電話,
  // 4=LINE 名稱, 5=Email, 6=地址, 7=型號, 8=型號優惠價, 12=照片資料夾, 14=照片數
  const newOrders = rows.filter(function (r) {
    const ts = r[1];
    return ts instanceof Date && ts > since;
  });

  if (newOrders.length === 0) {
    console.log('Digest: 自 ' + formatDate(since, 'yyyy-MM-dd HH:mm') + ' 起無新訂單，不寄信');
    // 即使沒新單，也更新 last run，避免下一輪重複算這段窗口
    props.setProperty(DIGEST_LAST_RUN_KEY, now.toISOString());
    return;
  }

  const totalCount = lastRow - 1;
  const sinceStr = formatDate(since, 'yyyy-MM-dd HH:mm');
  const nowStr = formatDate(now, 'yyyy-MM-dd HH:mm');
  const subject = `[APEX 團購] 📦 新訂單整理 · ${newOrders.length} 筆（累計 ${totalCount}/100）`;

  const orderLines = newOrders.map(function (r, i) {
    const orderNo   = r[0];
    const ts        = r[1] instanceof Date ? formatDate(r[1], 'MM/dd HH:mm') : '';
    const name      = r[2];
    const phone     = r[3];
    const lineName  = r[4] || '—';
    const email     = r[5] || '—';
    const address   = r[6];
    const model     = r[7];
    const price     = r[8];
    const folderUrl = r[12] || '—';
    const photoCnt  = r[14] || 0;
    return [
      `【${i + 1}】${orderNo} · ${ts}`,
      `  姓名：${name}　電話：${phone}　LINE：${lineName}`,
      `  Email：${email}`,
      `  地址：${address}`,
      `  型號：${model}（NT$ ${Number(price).toLocaleString()}）　照片：${photoCnt} 張`,
      `  資料夾：${folderUrl}`,
    ].join('\n');
  }).join('\n\n');

  const body = [
    `📦 APEX 團購新訂單整理`,
    `期間：${sinceStr} ～ ${nowStr}`,
    `本期新增：${newOrders.length} 筆　累計：${totalCount} / 100 組　剩餘名額：${Math.max(0, 100 - totalCount)} 組`,
    '',
    '──── 新訂單明細 ────',
    orderLines,
    '',
    '────────────────',
    '請廠商在 1-2 個工作日內聯繫客戶安排丈量。',
    '完整訂單清單請進 Google Sheet 查看。',
  ].join('\n');

  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAILS.join(','),
      subject: subject,
      body: body,
    });
    props.setProperty(DIGEST_LAST_RUN_KEY, now.toISOString());
    console.log('Digest 已寄出 → ' + NOTIFY_EMAILS.join(', ') + '（' + newOrders.length + ' 筆）');
  } catch (err) {
    console.error('Digest mail failed:', err);
  }
}

// ============ 一鍵建立 digest 排程 ============
// 在 Apps Script 編輯器手動執行一次即可（之後 GAS 會每兩天自動跑 sendDigest）
// 重跑此函式會清掉舊 trigger 再建新的，避免重複
function setupDigestTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDigest') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('sendDigest')
    .timeBased()
    .everyDays(DIGEST_INTERVAL_DAYS)
    .atHour(9) // 每兩天早上 9 點
    .create();
  console.log('✓ Digest trigger 已建立：每 ' + DIGEST_INTERVAL_DAYS + ' 天早上 9 點執行 sendDigest');
}

// ============ Helpers ============
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDate(date, pattern) {
  return Utilities.formatDate(date, 'Asia/Taipei', pattern);
}

// ============ 開發 / 測試用 ============
// 在 Apps Script 編輯器手動執行此函式可建立測試訂單，驗證流程是否通
function testSubmit() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        name: '測試客戶',
        phone: '0912-345-678',
        lineName: '測試 LINE',
        email: 'test@example.com',
        address: '台北市大安區忠孝東路 1 號',
        model: 'AP100',
        measureRead: true,
        noticeRead: true,
        disclaimerRead: true,
        photos: [], // 測試不傳圖
        submittedAt: new Date().toISOString(),
        userAgent: 'GAS-test',
      }),
    },
  };
  const result = doPost(fakeEvent);
  console.log(result.getContent());
}

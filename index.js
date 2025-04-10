const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const port = 8000;

let dadosAtuais = {};

async function coletarDadosGiftCards() {
  console.log("🔄 Coletando cashback...");
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://shopping.inter.co/gift-card', { waitUntil: 'networkidle0', timeout: 60000 });

    const giftCards = await page.evaluate(() => {
      const cards = {};
      document.querySelectorAll('[data-testid="gift-card"]').forEach(card => {
        const nome = card.querySelector('.GiftCardstyles__GiftCardName-sc-l5wiub-4')?.innerText.trim();
        const cashbackText = card.querySelector('.GiftCardstyles__CashbackValue-sc-l5wiub-5')?.innerText.trim();
        const cashbackMatch = cashbackText?.match(/([\d,]+)%/);
        const cashback = cashbackMatch ? parseFloat(cashbackMatch[1].replace(',', '.')) : null;
        if (nome && cashback !== null) cards[nome] = cashback;
      });
      return cards;
    });

    dadosAtuais = giftCards;
    await browser.close();
    console.log("✅ Cashback atualizado com sucesso:", dadosAtuais);
  } catch (e) {
    console.error("❌ Erro ao coletar dados:", e.message);
  }
}

// Coleta inicial e depois a cada 5 minutos
coletarDadosGiftCards();
setInterval(coletarDadosGiftCards, 5 * 60 * 1000);

app.get('/cashback.json', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json(dadosAtuais);
});

app.listen(port, () => {
  console.log(`✅ Servidor escutando em http://localhost:${port}/cashback.json`);
});

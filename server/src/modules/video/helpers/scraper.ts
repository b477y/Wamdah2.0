import puppeteer from "puppeteer";

export const scrapeText = async (url) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForSelector("body");

    const text = await page.evaluate(() => {
      const selectors = [
        "h1",                    
        "#productTitle",                
        "#productTitle",                
        ".a-price-whole",                
        ".price",                
        ".product-price",        
        ".product-title",        
        ".product-description", 
        ".description",          
        ".features",         
        "ul li",              
        "span",                
        "p"                     
      ];

      const content = [];

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const text = el.innerText?.trim();
          if (text && text.length > 10 && !content.includes(text)) {
            content.push(text);
          }
        });
      });

      return content.join("\n");
    });

    await browser.close();
    return text;
  } catch (error) {
    console.error("Scraping failed:", error);
    await browser.close();
    throw new Error("Failed to scrape product text");
  }
};

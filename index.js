import puppeteer from 'puppeteer'
import { transposeIterableHandle } from 'puppeteer';

const url = "https://chapmanganato.to/manga-vx999006"

const main = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    
    const mangaTitle = await page.evaluate(() => {
        return document.querySelector('.story-info-right h1')?.textContent.trim();
    });
    
    const chapters = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.row-content-chapter li'))
            .slice(0,5) // get the first five results
            .map(el => ({ // check each attribute/element of .row-content-chapter li')
                // "el" is just a variable name for '.row-content-chapter li'
            title: el.querySelector('a')?.title.trim(), // can use textContent instead of title
            link: el.querySelector('a')?.href,
            date: el.querySelector('.chapter-time')?.getAttribute('title').trim()
        }));
    });
    
    console.log(`📖 Manga Title: ${mangaTitle}`);
    console.log('📜 Chapters:', chapters);
      
    await page.screenshot({path: 'test.png'})
    await browser.close();
}

main();

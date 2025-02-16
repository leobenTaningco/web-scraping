import puppeteer from 'puppeteer'
import { transposeIterableHandle } from 'puppeteer';

const url = "https://chapmanganato.to/manga-vx999006"

async function searchManga(title){
    console.log("searchManga is being called")
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const aurl = 'https://chapmanganato.to/'
    await page.goto(aurl, {waitUntil: 'domcontentloaded'}) // waits for the whole page to render

    const searchInputSelector = 'input#search-story'; // can also use .search-story input (i think)
    await page.waitForSelector(searchInputSelector); // basically means wait for it to render
    await page.type(searchInputSelector, title, {delay:100});// mimic  human typing speed

    await new Promise(resolve => setTimeout(resolve, 2000)); 
    // wait for a set time (2 seconds), giving enought time for the search results to load

    await page.waitForSelector("#SearchResult"); 
    // it waits BUT it finishes as soon as it partially loads, even if it's not fully loaded

    //await page.screenshot({path: 'Stest.png'})

    const results = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#SearchResult ul a'))
            .slice(0,5)
            .map(ul => (
            ul.href.trim() // is now a string instead of an object
        ));
    });

    await browser.close();

    for (const url of results){
        getNames(url)
    }
    return results;

}



async function getNames(url){
    console.log(`getNames is being called `)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try{
        await page.goto(url);
        const mangaTitle = await page.evaluate(() => {
            return document.querySelector('.story-info-right h1')?.textContent.trim();
        })
        console.log(`📖 Manga Title: ${mangaTitle}`)
        await browser.close();
    }catch (error){
        await page.goto(url);
        const mangaTitle = await page.evaluate(() => {
            return document.querySelector('.story-info-right h1')?.textContent.trim();
        })
        console.log(`📖 errManga Title: ${mangaTitle}`)
        await browser.close();
    }finally{
        await browser.close(); // so that if an error happens, it closes the tab
    }

}
async function getChapter(url){

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
                // is an object
            title: el.querySelector('a')?.title.trim(), // can use textContent instead of title
            link: el.querySelector('a')?.href,
            date: el.querySelector('.chapter-time')?.getAttribute('title').trim()
        }));
    });
    
    console.log(`📖 Manga Title: ${mangaTitle}`);
    console.log('📜 Chapters:', chapters);
      
    //await page.screenshot({path: 'test.png'})
    await browser.close();

}

const main = async () => {

    const url = await searchManga('spy x');

}
main();

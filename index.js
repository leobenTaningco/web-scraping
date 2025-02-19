import puppeteer from 'puppeteer'
import readline from 'readline';
import { stdin as input, stdout as output } from 'node:process';

async function launchBrowser(){
    return await puppeteer.launch({headless: false});
}

async function searchManga(browser, title){
    console.log("searchManga is being called")
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

    try{    
        const urls = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('#SearchResult ul a'))
                .slice(0,5)
                .map(ul => (
                ul.href.trim() // is a string instead of an object, {} if u want an object 
            ));
        });
        await page.close();
        const results = [];
        for(const url of urls){
            const title = await getNames(browser, url); 
            results.push({Title: title, Link: url});
        }
        return results;
    }catch(error){
        console.log(title + " not found");
        return [];
    }

}

async function getNames(browser, url){
    console.log(`getNames is being called `)
    const page = await browser.newPage();

    try{
        await page.goto(url);
        const mangaTitle = await page.evaluate(() => {
            return document.querySelector('.story-info-right h1')?.textContent.trim();
        });
        
        return mangaTitle;
    }catch (error){
        await page.goto(url);
        const mangaTitle = await page.evaluate(() => {
            return document.querySelector('.story-info-right h1')?.textContent.trim();
        });
        
        return mangaTitle;
    }finally{
         // if an error happens, it closes the tab
         await page.close();
    }

}
async function getChapter(browser, url){
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
    await page.close();

}

const main = async () => {
    const browser = await launchBrowser();
    const rl = readline.createInterface({input,output});

    rl.question("Enter title: ", async (title) =>{
        console.log("Searching for " + title);
        const results = await searchManga(browser, title);  
        if(results.length===0){
            console.log("Nothing found");
            rl.close;
            return;
        }

        results.forEach((manga, index) => {
            console.log(`${index+1}. ${manga.Title} ${manga.Link}` )
        })
        
        rl.question("Choose a number: ", async (choice) => {
            const selectedIndex = parseInt(choice,10)-1;

            if(selectedIndex >= 0 && selectedIndex < results.length){
                console.log(`Fetching ${results[selectedIndex].Title}`);
                await getChapter(browser, results[selectedIndex].Link);
            }else{
                console.log("nah bro choose a number it aint hard");
            }
            await browser.close();
            rl.close();
        })
    })

}
main();

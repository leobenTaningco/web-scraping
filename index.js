import puppeteer from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import readline from 'readline';
import { stdin as input, stdout as output } from 'node:process';
import { link } from 'node:fs';

async function launchBrowser(){
    return await puppeteer.launch({headless: false});
}

//NEEDS PUPPETEER
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
        await browser.close();
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

//DOES NOT NEED PUPPETEER
async function getNames(browser, url){
    console.log(`getNames is being called `)
    try{
        const {data} = await axios.get(url) 
        const $ = cheerio.load(data);
        const mangaTitle = $('.story-info-right h1').text().trim()

        return mangaTitle;
    }catch (error){
        console.error("Error fetching manga title:", error);
        return "Error retrieving title";
    }
}

//DOES NOT NEED PUPPETEER
async function getChapter(browser, url){
    console.log(`getChapter is being called `)
    try{
        const {data} = await axios.get(url);
        const $ = cheerio.load(data);
        const mangaTitle = $('.story-info-right h1').text().trim();

        const chapters = $('.row-content-chapter li')
            .slice(0,5)
            .map((_,el) => ({
                title: $(el).find('a').attr("title")?.trim(),
                link: $(el).find('a').attr("href"),
                date: $(el).find('.chapter-time').attr("title")?.trim()
            }))
            .get() // convert to array

        console.log(`📖 Manga Title: ${mangaTitle}`);
        console.log('📜 Chapters:', chapters);
        return {mangaTitle, chapters};
    }catch{
        console.error("Error fetching manga chapters:", error);
        return "Error retrieving chapters";
    }
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
            
            rl.close();
        })
    })

}
main();

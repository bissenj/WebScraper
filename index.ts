import playwright from 'playwright';
import axios from 'axios';
import cheerio from 'cheerio';

const pages:string[] = [];
const results:string[] = [];


// Utility class to crawl page
export class PageScraper {
    // Scrape page with Axios (won't get content loaded with dynamic js)
    async scrapePageAxios(url: string) {
        const response = await axios.get(url);
        const html = response.data;
        console.log(html);

        const $ = cheerio.load(html);
        const links = $('a');
        //console.log('Links: ', links);
    }

    async scrapePagePlaywright(url: string) {
        const browser = await playwright.chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(url);
        const html = await page.content();
        //console.log(html);
        await browser.close();
        
        return html;
    }
}


function filterLink(href:string) {
    let result = href;

    // Weed out external links
    if (href.includes('http')) return null;

    // Weed out anchor links
    if (href.startsWith('#')) return null;

    // Weed out other links
    if (href.includes(':')) return null;

    // Weed out home links
    if (href == ('/')) return null;

    // Strip out directory nav
    if (href.includes('../')) {
        result = href.replace(/([.][.][/])/g, '');        // https://regexr.com/            
    }

    // Make sure link starts with a '/'
    if (!result.startsWith('/')) {
        result = '/' + result;
    }

    return result;
}


async function scrapePage(scraper:any, url:string) {
    if (scraper && url) {
        console.log('...scraping page: ', url);
        const html = await scraper.scrapePagePlaywright(url);

        extractLinks(html);
    }
}

async function extractLinks(html:string) {    
    // Extract the links on the page
    if (html) {
        console.log('...extracting links');
        const $ = cheerio.load(html);

        const links = $(`a`);
        //console.log('...found: ', links);

        links.each((idx, el) => {
            const text = $(el).text();
            const href = $(el).attr("href");
            if (href) {
                const result = filterLink(href);
                if (result) {
                    // Make sure this link isn't already known
                    if (!results.includes(result)) {
                        console.log('...adding ', result);
                        results.push(result);
                    }
                    else {
                        console.log('...already know about ', result);
                    }                    
                }
            }
        })     

        //console.log('Links: ', results);
    }
}


async function main() {
    console.log('hello world');      
    
    // const home = "https://mountainsandcode.com";
    const home = "https://nightlight-api.fly.dev";

    const scraper = new PageScraper();
    await scrapePage(scraper, home);

    let i = 0;
    while (i < results.length) {
        const page = results[i++];        
        await scrapePage(scraper, `${home}${page}`);
    }
    
    console.log('All Pages on site: ', results);    
}

main();



/* Goal:  search entire site, generate an array of objects looking like this:

const links = [
    {
        url: "/",
        title: "Home | Mountains and Code",
        link-count: 7,
    },
    {
        url: "/career/nwm",
        title: "NWM | Mountains and Code",
        link-count: 0,
    }
]

*/
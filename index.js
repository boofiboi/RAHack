import readline from 'readline';
import clc from 'cli-color';
const rl = readline.createInterface({input:process.stdin,output:process.stdout})
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAuthorization, getGameExtended, getGameInfoAndUserProgress, } from "@retroachievements/api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let userdetailscheck = fs.existsSync(path.join(__dirname, "auth.json"))

console.clear()
if(!userdetailscheck){
    (async () => {
        console.log(clc.red("Auth file does not exist, running first setup!"))

        const ask = (prompt) => new Promise(resolve => rl.question(prompt, resolve))

        const RAAPIKEY = await ask(clc.blue("Enter your RA API key (Obtainable here: https://retroachievements.org/settings#:~:text=Update-,Authentication,-Web%20API%20Key): "))
        const RAUSERNAME = await ask(clc.blue("Enter your RA username: "))
        const RAPASSWORD = await ask(clc.blue("Enter your RA password" + clc.yellow(" This is not saved, it is only sent to RA servers to get your login token. ") + ": "))

        const myHeaders = new Headers();

    //Hardcoded user agent, from what ive tested RA doesnt check this, its only to let you call the emulator API at dorequest.php
    //Without the user agent, the API returns 403.
        myHeaders.append("User-Agent", "PCSX2 v2.6.3 (Microsoft Windows 10+)");

        const formdata = new FormData();
        formdata.append("r", "login");
        formdata.append("u", RAUSERNAME);
        formdata.append("p", RAPASSWORD);

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: formdata,
          redirect: "follow"
        };

        try {
          const response = await fetch("https://retroachievements.org/dorequest.php?", requestOptions);
          const result = await response.json();
          fs.writeFileSync(path.join(__dirname, "auth.json"), JSON.stringify({RaUserToken: result.Token, RaKey:RAAPIKEY, RaUsername: RAUSERNAME}, null, 2), "utf8")
          console.log(clc.green("Sucesfully saved auth tokens, proceeding to app."))
          GameSelect()
        } catch (error) {
          console.error(error);
        };
    })()
}


async function givecheevo(id){
    const userdetails = JSON.parse(fs.readFileSync(authPath, "utf8"));
    RaUsername = userdetails.RaUsername;
    RaAPIKey = userdetails.RaKey;
    let RaUserTokenFunny = userdetails.RaUserToken
    const myHeaders = new Headers();
    myHeaders.append("User-Agent", "PCSX2 v2.6.3 (Microsoft Windows 10+)");

const formdata = new FormData();
formdata.append("r", "awardachievement");
formdata.append("t", RaUserTokenFunny);
formdata.append("u", RaUsername)
formdata.append("a", id);
formdata.append("h", "1");

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: formdata,
  redirect: "follow"
};

try {
  const response = await fetch("https://retroachievements.org/dorequest.php?", requestOptions);
  const result = await response.json();
  if(result.Success){
    console.log(clc.greenBright("Succesfully added achievement ID " + result.AchievementID))
  }else{
    console.error(clc.redBright("Error giving achievement with ID " + result.AchievementID + "\n" + "Reason: " + clc.blue(result.Error)))
  }
} catch (error) {
  console.error(error);
};
}
let RaUsername, RaAPIKey, authorization;
const authPath = path.join(__dirname, "auth.json");
if (fs.existsSync(authPath)) {
    const userdetails = JSON.parse(fs.readFileSync(authPath, "utf8"));
    RaUsername = userdetails.RaUsername;
    RaAPIKey = userdetails.RaKey;
    authorization = buildAuthorization({ username:RaUsername, webApiKey:RaAPIKey });
}


function GameSelect(){
rl.question(clc.yellow("Enter game ID" + clc.red(" (Q to quit)" + clc.yellow(": "))), answer =>{
    if(!answer) return GameSelect()
    if(answer.toLowerCase() == "q"){
        rl.close()
        return
    }
    if(Number.isNaN(Number(answer))){
        console.clear()
        console.error(clc.redBright("Invalid selection! Try again."))
        return GameSelect()
    } 
    console.log(clc.green("Fetching game information..."))
    GetGameData(answer)
    
})
}

async function GetGameData(gameid){
    console.clear()
    const gameinfo = await getGameInfoAndUserProgress(authorization, {username: RaUsername, gameId: gameid })
    console.log(clc.magenta("Game Title: " + clc.white(gameinfo.title) + "\n" + clc.magenta("Platform: " + clc.white(gameinfo.consoleName) + "\n" + clc.magenta("Number of achievements: " + clc.white(gameinfo.numAchievements)))))
    console.log(clc.magenta("Achievements unlocked: " + clc.white(gameinfo.numAwardedToUser) + "/" + clc.white(gameinfo.numAchievements)))
    dothingy(gameinfo)
}

function dothingy(gameinfo){
    console.log(clc.cyan("1. Give all achievements for game (Risky)"))
    console.log(clc.cyan("2. Give specific achievement based on ID"))
    console.log(clc.cyan("3. Give all achievements sequentially (Takes time, safest option)"))
    console.log(clc.cyan("4. Search through achievements"))
    rl.question("What do you want to do?" + clc.red(" (Q to quit): "), answer =>{
        if(answer.toLowerCase() == "q"){
            rl.close()
            return
        }
        if(Number.isNaN(Number(answer))){
            console.clear()
        console.error(clc.redBright("Invalid selection! Try again."))
        return dothingy(gameinfo)
    } 
        if(answer == 1){
            console.clear()
            rl.question(clc.bgWhiteBright(clc.bgWhiteBright(clc.red("Are you sure?\nDoing this will make all achievements appear to be unlocked at the same time (e.g 6:58pm, depending on time taken to unlock them)\nIt will also show you having mastered the game in a very short time!\nType yes/no"))) + "\n", answer=>{
                let lowercaseanswer = answer.toLowerCase()
                switch(lowercaseanswer){
                    case "no":
                        return dothingy(gameinfo)
                    case "yes":
                        const list = Array.isArray(gameinfo.achievements) ? gameinfo.achievements : Object.values(gameinfo.achievements);
                        if (!gameinfo || list.length === 0) {
                            console.log(clc.redBright("No achievements found for this game."));
                            return dothingy(gameinfo)
                        }
                        if(gameinfo.numAwardedToUser >= gameinfo.numAchievements){
                            console.clear()
                            console.error(clc.red("You already have all achievements for this game!"))
                            return dothingy(gameinfo)
                        }
                        (async () => {
                            for (const ach of list) {
                                const id = ach.id ?? ach.achievementId ?? ach.index ?? "unknown";
                                await givecheevo(id);
                                await new Promise(r => setTimeout(r, 1000));
                            }
                        console.log(clc.greenBright("All achievements awarded!"))
                        dothingy(gameinfo)
                    })();}})}})}

GameSelect()


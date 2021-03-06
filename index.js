/********************************** 
TODO:
- Add Discord Bot functionality
	- Commands like check_sub_gap, pewds_subs, tseries_subs, etc...
	- Automatically pinging @everyone when the sub gap is low :D
- Improve Twitter functionality (tweet every x hours, maybe?)
- Add check for rate limiting (twitter only for now, I dont think we'd hit the google quota)
- Reddit functionality too?
- Telegram??
- ANY PLATFORM THAT SUPPORTS BOTS AND HAS A NODEJS API?????
**********************************/

//Utils
const chalk = require('chalk');
const humanize = require('humanize-number');

//Sources
const Twit = require('twit');
const {
	YouTube
} = require('better-youtube-api');

//Config and init
const CONFIG = require('./config.json');
const youtube = new YouTube(CONFIG.youtube.api_key);

//Init twitter
const T = new Twit({
	consumer_key: CONFIG.twitter.consumer_key,
	consumer_secret: CONFIG.twitter.consumer_secret,
	access_token: CONFIG.twitter.access_token,
	access_token_secret: CONFIG.twitter.access_token_secret
});


function getStats() {
	return new Promise(async resolve => {
		const [pewdiepie, tseries] = await Promise.all([
			youtube.getChannel('UC-lHJZR3Gqxm24_Vd_AJ5Yw'),
			youtube.getChannel('UCq-Fj5jknLsUf-MWSy4_brA')
		  ]);
		  resolve({
			  pewdiepie: parseInt(pewdiepie.data.statistics.subscriberCount),
			  tseries: parseInt(tseries.data.statistics.subscriberCount),
			  difference: parseInt(pewdiepie.data.statistics.subscriberCount - tseries.data.statistics.subscriberCount) //Javascript wonders
		  })
	})
  }

//Listen for tweets from TSeries and PewDiePie
const stream = T.stream('statuses/filter', {
	follow: ['286036879', '39538010', '1068166867238494208']
});
stream.on('tweet', (tweet) => {
	//Check if it's not a RT by checking the twitter ID
	if (tweet.user.id_str === '39538010' || tweet.user.id_str === '286036879' || tweet.user.id_str == '1068166867238494208') {
		//Get the statistics
		getStats().then(res => {
			let msg;
			if (res.difference <= 25000) {
				//SOUND THE ALARM!
				msg = `CALLING ALL 9 YEAR OLDS! SUBSCRIBE TO PEWDIEPIE NOW! PewDiePie [${humanize(res.pewdiepie)} subs] is currently ONLY ${humanize(res.difference)} subs away from TSeries [${humanize(res.tseries)} subs]!
				#SavePewDiePie #SubscribeToPewDiePie`;
			} else {
				//Okay we're a good number away
				msg = `Subscribe to PewDiePie! PewDiePie [${humanize(res.pewdiepie)} subs] is currently ${humanize(res.difference)} subs away from TSeries [${humanize(res.tseries)} subs]!
				#SavePewDiePie #SubscribeToPewDiePie`;
			}

			//Actually reply to the said tweet
			T.post('statuses/update', {
				status: msg,
				in_reply_to_status_id: tweet.id_str,
				auto_populate_reply_metadata: true
			}, (err, data, response) => {
				if (err) {
					//If someone can improve this please do I hate error handling thanks
					console.log(chalk.red('Error tweeting!', err));
				} else {
					//Too lazy to check the data for an actual OK response, I'm sleepy and tired
					console.log(chalk.green(`Tweeted successfully at @${tweet.user.screen_name}!`));
				}
			});
		});
	}
});
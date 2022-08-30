const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();

oauth.tokenRequest({
	clientId: "1013952682370813992",
	clientSecret: "RiE5Vpk6Sn3bWdBu60DOaWmE7EOIqktP",

	code: "onMtrEYCbI9TbIzgOdTxRVV0tokdQH",
	scope: "identify",
	grantType: "authorization_code",

	redirectUri: "http://localhost:4000/discord/callback",
}).then(console.log)
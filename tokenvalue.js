#! /usr/bin/env node

var Etherest = require('etherest');
var CoinMarketCap = require('coinmarketcap');

var request = require('request-promise');

var _ = require('lodash');
var BigNumber = require('bignumber.js');

var argv = process.argv.slice(2);

/**
 * Tries to find price data for a token from coinmarketcap.com given a symbol and name
 */

async function getTokenPriceData (symbol, name) {
	symbol = symbol.toLowerCase();
	name = name.toLowerCase();

	let tickers = await request('https://api.coinmarketcap.com/v1/ticker/', {
		json: true
	});

	return _.find(tickers, function (ticker) {
		var tickerSymbol = ticker.symbol.toLowerCase();
		var tickerName = ticker.name.toLowerCase();

		if (symbol) {
			if (symbol == tickerSymbol || symbol === tickerName) return true;
		}

		if (name) {
			if (name === tickerName || name === tickerSymbol) return true;
		}

		return false;
	});
}

/**
 * Main function
 */

(async function () {

	let token = await Etherest.address(argv[0]).loadAbi();

	try {
		var [name, symbol, decimals, balance] = await Promise.all([
			token.name(),
			token.symbol(),
			token.decimals(),
			token.balanceOf(argv[1])
		]);
	} catch (err) {
		throw "Could not get required data from token contract";
	}

	let price = await getTokenPriceData(symbol, name);
	if (!price) throw "Could not find price data for " + name;

	let divisor = new BigNumber(10).toPower(decimals);
	balance = new BigNumber(balance).div(divisor);

	console.log(argv[1] + " holds " + balance + " " + symbol + " worth " + balance.mul(price.price_usd) + " USD");

})();
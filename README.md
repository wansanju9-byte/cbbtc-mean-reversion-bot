# cbBTC mean-reversion bot

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/wansanju9-byte/cbbtc-mean-reversion-bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/wansanju9-byte/cbbtc-mean-reversion-bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

A mean-reversion trading bot for Coinbase Wrapped BTC (cbBTC) on make.fun's
"Race a BTC trading bot live for 24 hours" bounty, $250 in USDC.

It buys a dip of 0.5% below the 240-minute simple moving average of
1-minute cbBTC closes, sells on a 0.5% rip above it, and stops out at 2%
below the entry or the average. Full size, long only, $1,000 paper money.

## Run it

```sh
node cli/makefun.mjs grade-local --kit . --bot . --driver process
```

Local dev grade: **+$7.74 net PnL, 4 trades, 1.07% max drawdown** on the
published dev window (buy-and-hold made $1.07, momentum $2.45).

---

Entered on [make.fun](https://make.fun/?ref=00dvrnv4&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards

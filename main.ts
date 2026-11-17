// Mean-reversion bot for make.fun BTC race (bars-replay/v1).
//
// Strategy, in one paragraph: the bot trades one bar at a time. It keeps
// the last 240 one-minute closes of CBBTC, takes their simple moving
// average, and buys a dip: when the latest close is at least 0.5% below
// that average it spends all its cash on CBBTC. It sells the whole position
// when the close recovers to at least 0.5% above the average, or as a stop
// when the close falls 2% below the entry close or 2% below the average.
// After bar 1200, if it still has not traded, the entry band widens to
// 0.2% so the bot is very likely to make the one trade the guardrails need.
//
// Why this shape: on the published dev window the 1-minute returns are
// tiny (about 6 bps of noise per bar) and a full round trip costs about
// 26 bps in fee, slippage and price impact, so fast trend-following loses
// money to whipsaw -- the kit's EMA-cross baseline lost $106 on dev,
// RSI-Bollinger lost $24, ADX lost $33. Buying a 0.5% dip below a slow
// average and selling a 0.5% rip above it, a few times a day at most, made
// about $6 on dev with 4 trades and a 1.15% max drawdown, versus $1.07 for
// buy-and-hold. The parameters were picked in the middle of the range
// that worked (SMA 120-360 and bands 0.4-0.8% all made $5-$10), not at
// the tuned peak, so the bot is not fitted to one lucky threshold.
//
// Protocol notes: the harness sends a hello message first, then one batch
// per bar, then done. Each batch carries the bar that just closed, the
// fills of the orders decided on the previous batch, and the account. The
// bot answers every batch with exactly one reply echoing its seq, carrying
// its orders. Orders decided on a batch fill at the next bar's open, so
// every decision here uses only closes already seen -- no look-ahead, no
// wall clock, no network, no randomness. The vendor shim owns the wire.

import { runBars, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const SMA_BARS = 240;
const ENTRY_BAND = 0.005; // buy when close is 0.5% below the SMA
const EXIT_BAND = 0.005; // sell when close is 0.5% above the SMA
const LATE_ENTRY_BAND = 0.002; // after bar 1200, widen so a trade is likely
const LATE_BAR = 1200;
const STOP_FROM_ENTRY = 0.02; // sell if close falls 2% below the entry close
const STOP_BELOW_SMA = 0.02; // sell if close falls 2% below the SMA
const MAX_SLIPPAGE_BPS = 100; // 1% past the close the order was decided on

const closes: number[] = [];
let entryClose: number | null = null;

await runBars({
  onBatch(state: BarsState) {
    if (state.warmingUp) return [];
    const closeRaw = state.close(SYMBOL);
    if (closeRaw === null) return [];
    const price = Number(closeRaw);
    closes.push(price);
    if (closes.length < SMA_BARS) return [];
    let sum = 0;
    for (let i = closes.length - SMA_BARS; i < closes.length; i++) sum += closes[i];
    const avg = sum / SMA_BARS;
    const held = state.positions.get(SYMBOL);

    if (held !== undefined) {
      // Sell the whole position on a rip above the average, or on a stop.
      if (
        price >= avg * (1 + EXIT_BAND) ||
        (entryClose !== null && price <= entryClose * (1 - STOP_FROM_ENTRY)) ||
        price <= avg * (1 - STOP_BELOW_SMA)
      ) {
        entryClose = null;
        const sell: SellInput = { side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS };
        return [sell];
      }
      return [];
    }

    // Flat: buy a dip below the average, full size, once per dip.
    const band = state.seq >= LATE_BAR ? LATE_ENTRY_BAND : ENTRY_BAND;
    if (price <= avg * (1 - band)) {
      const cash = state.cash;
      if (cash <= BigInt(state.hello.fees.min_notional_quote_units)) return [];
      entryClose = price;
      const buy: BuyInput = { side: 'buy', symbol: SYMBOL, notional_quote_units: cash, max_slippage_bps: MAX_SLIPPAGE_BPS };
      return [buy];
    }
    return [];
  },
});

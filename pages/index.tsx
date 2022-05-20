import axios from "axios";
import { useState } from "react";
import type { GetServerSideProps, NextPage } from "next";

interface Props {
  binance: number;
  ftx: number;
  candlestick: [];
  orderBook: { lastUpdateId: number; bids: []; asks: [] };
}

const Home: NextPage<Props> = ({ binance, ftx, candlestick, orderBook }) => {
  const [usdtAmount, setUsdtAmount] = useState<number>(0);
  const [btcAmount, setBtcAmount] = useState<number>(0);
  const price = {};
  candlestick.map((item) => {
    const result = {
      [new Date(item[0]).toISOString().replace("T", " ").slice(0, 16)]: {
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
      },
    };
    Object.assign(price, result);
  });

  // console.log(orderBook);
  // console.log(price);
  // console.log(usdtAmount);

  const calculateOutputAmount = (type: string) => {
    let available = usdtAmount;
    let getBTC = 0;
    for (let i = 0; i < orderBook.bids.length; i++) {
      const item = orderBook.bids[i];
      const price = item[0];
      const amount = item[1];
      const ratePrice = price * amount;
      if (ratePrice <= available && available > 0) {
        available = available - ratePrice;
        getBTC = Number(getBTC) + Number(amount);
      } else {
        if (available > 0) {
          getBTC = getBTC + available / price;
          available = available - getBTC * price;
        }
      }
    }
    setBtcAmount(getBTC);
  };
  return (
    <div className="w-full">
      <div className="grid grid-cols-2">
        <div className="border-2">
          <div>Binance : {binance}</div>
          <div>Ftx : {ftx}</div>
          <div>
            {`Diff (Binance) : ${ftx - binance} 
    ${(((ftx - binance) / binance) * 100).toFixed(2)} %`}
          </div>
        </div>
        <div>
          <span>Input USDT:</span>
          <input
            className="mx-2 border-2 border-gray-400 rounded-md"
            onChange={(e) => setUsdtAmount(Number(e.target.value))}
          />
          <button
            className="bg-gray-200 p-1 rounded-md"
            onClick={() => calculateOutputAmount("buy")}
          >
            Buy
          </button>
          <p>Output BTC: 0.00</p>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="border-2 border-gray-400">
          <div className="text-center border-2 border-b-gray-400">Buy</div>
          <div className="grid grid-cols-2 text-center">
            <div>Price</div>
            <div>Volume</div>
            {orderBook.bids.map((bid) => {
              return (
                <>
                  <div>
                    <div>{bid[0]}</div>
                  </div>
                  <div>
                    <div>{bid[1]}</div>
                  </div>
                </>
              );
            })}
          </div>
        </div>
        <div className="border-2 border-gray-400">
          <div className="text-center border-2 border-b-gray-400">Sell</div>
          <div className="grid grid-cols-2 text-center">
            <div>Price</div>
            <div>Volume</div>
            {orderBook.asks.map((bid) => {
              return (
                <>
                  <div>
                    <div>{bid[0]}</div>
                  </div>
                  <div>
                    <div>{bid[1]}</div>
                  </div>
                </>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const BinanceResult = await axios.get(
    "https://api1.binance.com/api/v3/avgPrice?symbol=BTCUSDT"
  );
  const FtxResult = await axios.get("https://ftx.com/api/markets/BTC/USDT");
  const Candlestick = await axios.get(
    "https://api1.binance.com/api/v3/klines?interval=1h&symbol=BTCUSDT"
  );
  const OrderBook = await axios.get(
    "https://api1.binance.com/api/v3/depth?symbol=BTCUSDT"
  );
  OrderBook.data.bids.sort();
  OrderBook.data.asks.sort();
  return {
    props: {
      binance: BinanceResult.data.price,
      ftx: FtxResult.data.result.price,
      candlestick: Candlestick.data,
      orderBook: OrderBook.data,
    },
  };
};

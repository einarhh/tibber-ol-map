import fetch from "node-fetch";
import express from "express";

const URL = "https://api.tibber.com/v1-beta/gql";
const TIBBER_API_KEY = process.env.TIBBER_API_KEY;
const PORT = 8080

async function queryTibber(query) {
  /* Query Tibber GraphQL API */
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      authorization: "Bearer " + TIBBER_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: query,
    }),
  });

  const responseBody = await response.json();

  // Check for error in response
  if (responseBody.errors) {
    console.error(responseBody.errors[0]?.message || "Tibber query failed");
  } else {
    return responseBody.data;
  }
}

async function getPrices() {
  /* Get price info, including home address */
  const response = await queryTibber(`{
      viewer {
        homes {
            address {
              address1
              latitude
              longitude
          }
          currentSubscription {
            priceInfo {
              current {
                total
                energy
                tax
                startsAt
              }
              today {
                total
                energy
                tax
                startsAt
              }
              tomorrow {
                total
                energy
                tax
                startsAt
              }
            }
          }
        }
      }
    }`);
  if (response) {
    return response.viewer.homes;
  }
}

async function getConsumption(res, last) {
  /* Get consumption, including home address */
  const response = await queryTibber(`{
    viewer {
      homes {
        size
        address {
          address1
          latitude
          longitude
        }
        consumption(resolution: ${res}, last: ${last}) {
          nodes {
            from
            to
            cost
            unitPrice
            unitPriceVAT
            consumption
            consumptionUnit
          }
        }
      }
    }
  }`);
  if (response) {
    return response.viewer.homes;
  }
}

let prices;
let consumptions;

async function fetchData() {
  console.log("Fetching data from Tibber")

  prices = await getPrices();

  const consumptionLast24 = await getConsumption("HOURLY", 24);
  const consumptionYesterday = await getConsumption("DAILY", 1);

  // Sum up consumption data for each hour for each home
  consumptions = consumptionLast24.map((home, index) => {
    const nodes = home.consumption.nodes;
    let consumption = nodes.reduce((previous, current) => {
      return {
        cost: previous.cost + current.cost,
        consumption: previous.consumption + current.consumption,
      };
    });
    consumption.address = home.address;
    consumption.from = nodes[0].from;
    consumption.to = nodes[nodes.length - 1].to;
    consumption.unitPrice = consumption.cost / consumption.consumption;

    // Include yesterdays consumption
    consumption.yesterday = consumptionYesterday[index].consumption.nodes[0];
    return consumption;
  });
}

// Fetch updated data every hour
setInterval(fetchData, 60 * 60 * 1000);
fetchData();

// Use express to serve static files and data fetched from Tibber
var app = express();

app.use(express.static("public"));

app.get("/consumption", (req, res, next) => {
  res.json(consumptions);
});

app.get("/prices", (req, res, next) => {
  res.json(prices);
});

app.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
});
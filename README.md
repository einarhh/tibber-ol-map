# tibber-ol-map
Show homes and consumption on a map.

Consists of a backend that uses the Tibber API to fetch consumption and price info every hour and serves then over a REST API along with a static page.
The page shows a OpenStreetMap with position of each home in the Tibber account.
Homes can be clicked to show consumption for the last 24 hours and yesterday.

![image](https://user-images.githubusercontent.com/20779590/153769463-b30abea3-11f7-41b9-968d-c09bd74e731c.png)

Tibber API key is read from the environment variable TIBBER_API_KEY.

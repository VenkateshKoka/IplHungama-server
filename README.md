# IplHungama-server
## IplHungama
Live chat application during IPL cricket matches including live scores
Tech stack: React on front-end and nodeJs on backend with MongoDB as database (for now). Authentication is done through firebase and emails are sent to verify while signing up. Learnt GraphQL while implementing this
1. Fully functioning to post real-time messages between the users
2. Semi-working live api scores from external api. 
3. Roadblocks: the free api is not actual real time/ number of requests per minute are very limited
4. Have a simple design on how to implement the live scores for a match in a series and how to update the commentary without refreshing(making continuous 
   requests to external api when a user is viewing the current live match and storing the result in cache and when others users are viewing, just read from cache.
   when reading from cache, if the data is older than specific time, make the api request for live scores and update the cache. while updating, store the commentary    and posts from users under match table in MongoDB. persisting in database, and now workflow is -> make api request/ read from cache, get data from database and      append it to latest data in cache and display on live match page. 

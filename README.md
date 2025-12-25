# Condorcet
Have friends join a 'voting' room, start a ranking-based runoff voting, and determine a condorcet winner through the tideman algorithm 

live link: https://www.tidemanvote.uk/

either create a room (or join). The host can add nominations. Also, chat on the chat tab :)

# Codebase

### Architecture

The backend uses bun with express for all basic routes and socket.io's websocket functionality for the real-time chat / room / status. 

On the frontend, using socket-io as well for websockets, we build the whole thing with react/nextjs with shadcn. 

### Backend 

`config/` has all the services that interact with the database (redis)

`middleware/` has all middleware that the routes use, mostly just to verify if a host has permission to progress a room to another state or add a nominee

`routes/` has all the routes, `test/` has all the test that can be run with bun's test runner 

`utli/` has the helper functions that determine the condorcet winner after all the votes are through 

### frontend

`hooks/` has the mutations (tanstack query) that are used. The actual functions for fetching are in `lib/`

`components/` and `app/` have the actual react components that are rendered on the pages 

`socket-config/` and `store/` have the configuration for the webockets and the global state storage (using zustand)

# Potential Improvements

For (temporary) data persistence, this app uses redis. Honestly, redis is probably not the best choice as a non-persistent database. It does work for having temporal data, but:

1. ram storage is expensive (the ec2 that the backend is running on is the crappy free tier)
2. This app really doesn't need ultra-low latency 

Also, the frontend needs to utilize optimistic updates more for a smoother feel. Page refreshes are also kind of unintuitive and buggy. 

Lastly, shadcn doesn't really look that good, and it supposedly offers customizability, but it really isn't. Trying to escape the default opinionated styles is nearly impossible. I'd honestly rather use pure css (with tailwind) than this stuff. Maybe radix? 



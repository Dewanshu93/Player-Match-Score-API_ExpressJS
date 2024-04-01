const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let database = null

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

const convertPlayerDBtoResponseObject = dbOject => {
  return {
    playerId: dbOject.player_id,
    playerName: dbOject.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const getAllPlayerQuery = `
            SELECT
              *
            FROM
              player_details;`
  const allPlayerDetails = await database.all(getAllPlayerQuery)
  response.send(
    allPlayerDetails.map(eachPlayer =>
      convertPlayerDBtoResponseObject(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getSinglePlayerSqlQuery = `
            SELECT
              *
            FROM
              player_details
            WHERE
              player_id=${playerId};`
  const singlePlayer = await database.get(getSinglePlayerSqlQuery)
  response.send({
    playerId: singlePlayer.player_id,
    playerName: singlePlayer.player_name,
  })
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const putSqlQuery = `
          UPDATE
            player_details
          SET
            player_name='${playerName}'
          WHERE player_id=${playerId};`
  await database.run(putSqlQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchSqlQuery = `
          SELECT
            *
          FROM
            match_details
          WHERE
            match_id=${matchId};`
  const matchData = await database.get(getMatchSqlQuery)
  response.send({
    matchId: matchData.match_id,
    match: matchData.match,
    year: matchData.year,
  })
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchofPlayerSqlQuery = `
              SELECT
                match_id,match,year
              FROM
                match_details
              NATURAL JOIN player_match_score
              WHERE player_id=${playerId};`
  const getMatchofPlayer = await database.all(getMatchofPlayerSqlQuery)
  response.send(
    getMatchofPlayer.map(eachMatch => {
      return {
        matchId: eachMatch.match_id,
        match: eachMatch.match,
        year: eachMatch.year,
      }
    }),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayerofMatchSqlQuery = `
                SELECT
                  player_id,player_name
                FROM
                player_details
                NATURAL JOIN player_match_score
                WHERE match_id=${matchId};`
  const getPlayersofMatch = await database.all(getPlayerofMatchSqlQuery)
  response.send(
    getPlayersofMatch.map(eachPlayer => {
      return {
        playerId: eachPlayer.player_id,
        playerName: eachPlayer.player_name,
      }
    }),
  )
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getTotalDetailofPlayerSqlQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `

  const totalDeatilsofPlayer = await database.get(
    getTotalDetailofPlayerSqlQuery,
  )
  response.send(totalDeatilsofPlayer)
})
module.exports = app

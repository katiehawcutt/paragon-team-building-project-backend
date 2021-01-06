// @ts-check
'use strict'

const { getGame } = require('../../models/factsGame/getGame')
const { playGuessWhoseFact } = require('./playGuessWhoseFact')
const { playGuessWhichFact } = require('./playGuessWhichFact')
const { delay } = require('./delay')
const { deleteGame } = require('../../models/factsGame/deleteGame')
const actions = require('../../constants/actions')

module.exports.playGame = async ({ gameId, broadcastToGame }) => {
    try {
        const { totalRounds } = await getGame({ gameId })

        for (let roundNumber = 1; roundNumber <= totalRounds; ++roundNumber) {
            console.log(`Round #${roundNumber}`)
            await playGuessWhoseFact({ gameId, roundNumber, broadcastToGame })
            await playGuessWhichFact({ gameId, roundNumber, broadcastToGame })
        }

        // All rounds have been played.
        {
            const game = await getGame({ gameId })
            const leaderboard = Object.values(game.players)
                .map(({ displayName, score }) => {
                    return {
                        displayName,
                        score,
                    }
                })
                .sort((a, b) => b.score - a.score)

            broadcastToGame({
                gameId,
                action: actions.PODIUM,
                turnId: game.currentTurnId,
                leaderboard,
                winners: leaderboard
                    .filter(({ score }) => score === leaderboard[0].score)
                    .map(({ displayName }) => displayName),
            })

            await delay(2)
            await deleteGame({ gameId })
            console.log('Deleted ' + gameId)
        }
    } catch (err) {
        console.error(err)
        return { err: 'Failed to play game' }
    }
    return {}
}

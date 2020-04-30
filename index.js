const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    next();
});
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const pool = mysql.createPool({
    connectionLimit : 24, //important
    host     : '127.0.0.1',
    port    : 3306,
    user     : 'team',
    password : 'team',
    database : 'teamGames',
    debug    :  false
});

getConnection = async () => {

    return await new Promise( async(resolve, reject) => {
        await pool.getConnection( (err,connection) => {
            if (err) {
                console.log("Failed to get connection: " + err);
                reject(err);
            }
            resolve(connection);
        });
    });
}


executeQuery = async(connection,query) => {
    return await new Promise((resolve,reject) => {
        connection.query(query,  (err,rows) => {
            if(err) {
                console.log(err);
                reject(err);
            }
            resolve(rows);
        });
    });
}

getGames = async (connection) => {
   const query = 'SELECT ID, NAME, STATE, MEETING_INDEX, RACE_INDEX FROM GAMES';
   return await executeQuery(connection,query);
}

getUsers = async (connection) => {
    const query = 'SELECT ID,NAME FROM USERS';
    return await executeQuery(connection,query);
}

getGame = async (connection,id) => {
    const query = 'SELECT ID,NAME, STATE, MEETING_INDEX, RACE_INDEX FROM GAMES WHERE ID=' + id + ';';
    let rows =  await executeQuery(connection,query);
    if (rows) {
        return rows[0];
    }
}


deletePlayerState = async(connection, gameId, playerId) => {
    const query = `DELETE FROM PLAYER_STATES WHERE PLAYER_ID=${playerId} AND GAME_ID=${gameId};`;
    return await executeQuery(connection, query);
}


setPlayerState = async(connection, gameId, playerId, state) => {
    await deletePlayerState(connection,gameId,playerId).then(async (result) => {
        const query = `INSERT INTO PLAYER_STATES (PLAYER_ID, GAME_ID, STATE) ` +
            `VALUES(${playerId},${gameId},${state});`;
        return await executeQuery(connection,query);
    })

}


getPlayerCountWithState = async(connection, gameId, state) => {
    const query  = `SELECT COUNT(*) AS COUNT FROM PLAYER_STATES ` +
        `WHERE PLAYER_ID IN (SELECT PLAYER_ID FROM GAME_PLAYERS where GAME_ID=${gameId} AND STATE=${state});`;
    return await executeQuery(connection,query);
}



deleteGame = async(connection, name) => {
  const query = `DELETE FROM GAMES WHERE NAME="${name}";`;
  return await executeQuery(connection,query);
}

addGame = async (connection, name) => {
    let query = `INSERT INTO GAMES (NAME,STATE, MEETING_INDEX, RACE_INDEX) VALUES ("${name.toUpperCase()}",0,-1,-1);`;
    let result = await executeQuery(connection,query);
    if (result) {
        console.log(result);
        query = `SELECT ID, NAME, STATE, MEETING_INDEX, RACE_INDEX FROM GAMES WHERE ID = (SELECT LAST_INSERT_ID());`;
        result = await executeQuery(connection, query);
        if (result) {
            return result;
        }
    }
}

updateGame = async(connection, gameObj) => {
    //TODO
}

updatePlayerInGame = async (connection, gameName, playerObj) => {
    //TODO
}

/**
 * Adds a player to a named game
 * @param connection
 * @param gameName
 * @param playerObj
 * @returns {Promise<any>}
 */
addPlayerToGame = async (connection, gameId, playerId) => {
    const query = `INSERT INTO GAME_PLAYERS (GAME_ID, PLAYER_ID) VALUES ( ${gameId}, ${playerId} );`
    return await executeQuery(connection,query);
}


getPlayersInGame = async(connection,gameId) => {
    const query = `SELECT GAME_PLAYERS.PLAYER_ID, GAME_PLAYERS.FUNDS, U.NAME as NAME FROM GAME_PLAYERS
    INNER JOIN USERS U on GAME_PLAYERS.PLAYER_ID = U.ID
    INNER JOIN GAMES G on GAME_PLAYERS.GAME_ID = G.ID
    WHERE G.ID = "${gameId}";`;
    return await executeQuery(connection,query);
}


addUser = async (connection, username, password, isAdmin) => {
    let query = `INSERT INTO USERS (NAME,PASSWORD) VALUES ("${username.toUpperCase()}","${password}");`;
    let result = await executeQuery(connection,query);
    if (result) {
        console.log(result);
        query = `SELECT ID, NAME FROM USERS WHERE ID = (SELECT LAST_INSERT_ID());`;
        result = await executeQuery(connection, query);
        if (result) {
            return result;
        }
    }
}


updateUser = async (connection, userObj) => {
    //TODO
}


/**
 * Removes a named player from a named game
 * @param connection
 * @param gameName
 * @param playerName
 * @returns {Promise<T>}
 */
deletePlayerFromGame = async (connection,gameId,playerId) => {
    const query = `DELETE FROM GAME_PLAYERS WHERE GAME_ID=${gameId} AND PLAYER_ID=${playerId};`
    return await executeQuery(connection,query);
};


authenticate =  async (connection,userName,password) => {
    const query = `SELECT ID,NAME FROM USERS WHERE NAME="${userName}" AND PASSWORD="${password}";`

    let result = await executeQuery(connection,query);
    if (result && result.length && result.length === 1) {
        return result[0]
    } else {
        return null;
    }
}


getHorsesForPlayer = async (connection, gameId, playerId) => {
    const query = `SELECT H.ID, H.NAME, H.HORSE_TYPE, H.SPEED_FACTOR, H.SLOWER_SPEED_FACTOR, H.ENERGY_FALL_DISTANCE FROM HORSES H
        INNER JOIN HORSE_OWNERSHIP HO on H.ID = HO.HORSE_ID
        WHERE HO.PLAYER_ID = ${playerId} AND HO.GAME_ID = ${gameId}`;
    return await executeQuery(connection,query)
}

/**
 * Save player horse selections for a meeting
 * @param connection
 * @param gameId
 * @param playerId
 * @param horses
 * @returns {Promise<boolean>}
 */
saveHorsesForPlayer = async (connection, gameId, playerId, horses) => {
    //TODO... delete horses currently assigned, not just the relationship
    let query = `DELETE FROM HORSES WHERE HORSES.ID IN (SELECT HORSE_ID FROM HORSE_OWNERSHIP where GAME_ID = ${gameId} and PLAYER_ID = ${playerId});`;
    console.log(query);
    let result = await executeQuery(connection,query);
    if (result) {
        // save each horse
        for (const horse of horses) {
            query = `INSERT INTO HORSES (NAME, HORSE_TYPE, SPEED_FACTOR, SLOWER_SPEED_FACTOR, ENERGY_FALL_DISTANCE)` +
                ` VALUES ( "${horse.NAME}", ${horse.HORSE_TYPE}, ${horse.SPEED_FACTOR}, ${horse.SLOWER_SPEED_FACTOR}, ${horse.ENERGY_FALL_DISTANCE});`;
            await executeQuery(connection,query).catch( (err) => {
                throw "Failed to insert horse details: " + err;
            }).
            then(async () => {

                    query = `INSERT INTO HORSE_OWNERSHIP (HORSE_ID, GAME_ID, PLAYER_ID)` +
                        ` VALUES ( (SELECT LAST_INSERT_ID()), ${gameId}, ${playerId} );`;
                    await executeQuery(connection,query).catch( (err) => {
                        throw "failed to insert horse ownership: " + err;
                    });

            });

        }
    } else {
        console.log("Failed to remove current horse assignments")
        return false;
    }

    return true;
}

/**
 * Get player horse selections for a meeting
 * @param connection
 * @param meetingId
 * @param gameId
 * @param playerID
 * @returns {Promise<*>}
 */
getPlayerHorsesForMeeting = async(connection, meetingId, gameId, playerId) => {
    const query = `SELECT RACE_ID, HORSE_ID as ID, H.NAME FROM HORSES_IN_RACE ` +
        `INNER JOIN HORSES H on HORSES_IN_RACE.HORSE_ID = H.ID ` +
        `WHERE HORSES_IN_RACE.RACE_ID IN (SELECT RACE_ID from MEETINGS WHERE ID=${meetingId}) ` +
        `AND HORSES_IN_RACE.PLAYER_ID = ${playerId} AND HORSES_IN_RACE.GAME_ID = ${gameId};`;
    return await executeQuery(connection,query);
}

/**
 * Get the form for a horse
 */
getHorseForm = async (connection,gameId,horseId) => {
    const query = `SELECT HORSE_ID, RACE_ID, POSITION, RACE_INDEX FROM HORSE_FORM where GAME_ID=${gameId} and HORSE_ID = ${horseId};`;
    return await executeQuery(connection,query);
}

/**
 * Get all bets for a race
 * @param connection
 * @param gameId
 * @param raceId
 * @returns {Promise<*>}
 */
getBetsForRace = async (connection,gameId, raceId) => {
    const query = `SELECT B.PLAYER_ID, U.NAME as PLAYER_NAME, B.HORSE_ID, H.NAME as HORSE_NAME, B.AMOUNT, B.TYPE, B.ODDS ` +
        `FROM BETS B Inner Join USERS U on B.PLAYER_ID = U.ID ` +
        `Inner Join HORSES H on B.HORSE_ID = H.ID ` +
        `WHERE B.RACE_ID=${raceId} AND B.GAME_ID = ${gameId}`;
        return await executeQuery(connection,query);
}

getMeetings = async(connection) => {
    const query = `SELECT ID, NAME FROM MEETINGS`;
    return await executeQuery(connection,query);
}

getRacesInMeeting = async(connection, meetingId) => {
    const query = `SELECT R.ID,R.NAME,R.LENGTH_FURLONGS,R.PRIZE FROM RACES R ` +
        `WHERE R.ID IN (SELECT RACE_ID FROM MEETING_RACES WHERE MEETING_ID=${meetingId});`
    return await executeQuery(connection,query);
}

getRaceInfo = async(connection, raceId) => {
    const query = `SELECT ID, NAME,LENGTH_FURLONGS,PRIZE FROM RACES WHERE ID=${raceId};`
    return await executeQuery(connection,query);
}


getHorsesForRace = async(connection, gameId, raceId) => {
    const query = `SELECT HR.HORSE_ID as ID, H.NAME, H.HORSE_TYPE, H.SPEED_FACTOR, H.SLOWER_SPEED_FACTOR, H.ENERGY_FALL_DISTANCE, HR.PLAYER_ID, U.NAME as PLAYER_NAME FROM HORSES_IN_RACE HR ` +
        `INNER JOIN HORSES H on HR.HORSE_ID = H.ID ` +
        'INNER JOIN USERS U ON HR.PLAYER_ID = U.ID ' +
        `WHERE HR.RACE_ID = ${raceId} AND HR.GAME_ID = ${gameId};`
    return await executeQuery(connection,query);
}

addHorseToRace = async(connection, gameId, raceId, horseId, playerId) => {
    // delete any existing entry
    let query = `DELETE FROM HORSES_IN_RACE WHERE GAME_ID = ${gameId} AND RACE_ID = ${raceId} and PLAYER_ID = ${playerId};`;
    await executeQuery(connection,query).then(async () => {
        // add entry
        query = `INSERT INTO HORSES_IN_RACE ( GAME_ID, RACE_ID, HORSE_ID, PLAYER_ID) ` +
            ` VALUES ( ${gameId}, ${raceId}, ${horseId}, ${playerId} );`;
        return await executeQuery(connection,query);
    });
}

getMeetingSelectionsReady = async(connection,meetingId, gameId) => {
    let query = `SELECT COUNT( DISTINCT PLAYER_ID) as C from HORSES_IN_RACE WHERE GAME_ID = ${gameId} ` +
        `AND RACE_ID IN (SELECT RACE_ID FROM MEETING_RACES WHERE MEETING_ID = ${meetingId});`;
    let playersWithSelectionsCount = 0;
    return await executeQuery(connection,query).catch( (err) => {
        console.log("Error getting count of selections made for meeting: " + err);
        return false;
    }).then( async (response) => {
        console.log('here');
        playersWithSelectionsCount = response[0].C;
        query = `SELECT COUNT(PLAYER_ID) as C FROM GAME_PLAYERS WHERE GAME_ID = ${gameId};`;
        return await executeQuery(connection,query).catch((err) => {
            console.log("Error getting count of selections made for meeting: " + err);
            return false;
        }).then((response) => {
            if (response[0].C === playersWithSelectionsCount) {
                return {result:true};
            }
        })
    })
}

clearBet = async(connection,betObject) => {
    const query = `DELETE FROM BETS WHERE ` +
        `PLAYER_ID = ${betObject.PLAYER_ID} AND HORSE_ID=${betObject.HORSE_ID} ` +
        `AND RACE_ID=${betObject.RACE_ID} AND GAME_ID=${betObject.GAME_ID} AND TYPE=${betObject.TYPE};`;
    return await executeQuery(connection,query);
}

storeBet = async(connection, betObject) => {
    await clearBet(connection,betObject);
    if (betObject && (betObject.AMOUNT)) {
        const query = `INSERT INTO BETS (PLAYER_ID, HORSE_ID, RACE_ID, GAME_ID, AMOUNT, TYPE, ODDS) VALUES ` +
            `(${betObject.PLAYER_ID},${betObject.HORSE_ID},${betObject.RACE_ID},${betObject.GAME_ID},` +
            `${betObject.AMOUNT},${betObject.TYPE},${betObject.ODDS});`;
        return await executeQuery(connection, query);
    } else {
        return true; // set value to zero not need to insert
    }
}

const getBets = async(connection, queryObj) => {
    let query;
    const selFields = 'SELECT B.PLAYER_ID, U.NAME as PLAYER_NAME, B.HORSE_ID, H.NAME as HORSE_NAME, ' +
        'B.RACE_ID, B.GAME_ID, B.AMOUNT, B.TYPE, B.ODDS FROM BETS B ' +
        'INNER JOIN USERS U on B.PLAYER_ID = U.ID ' +
        'INNER JOIN HORSES H on B.HORSE_ID = H.ID ' +
        'INNER JOIN RACES R on B.RACE_ID = R.ID ';
    if (!queryObj) {
        query = `${selFields};`;
    } else {
        if (queryObj.RACE_ID && queryObj.GAME_ID) {
            query = `${selFields} ` +
                `WHERE RACE_ID=${queryObj.RACE_ID} AND GAME_ID=${queryObj.GAME_ID}`;
            if (queryObj.PLAYER_ID) {
                query += ` AND PLAYER_ID=${queryObj.PLAYER_ID};`;
            }
            else {
                query += ';';
            }
        }
    }
    if (query) {
        return await executeQuery(connection,query);
    }

}



/**
 *validate a user
 */
app.post('/authenticate', async (req,res) => {;
    let connection =  await getConnection();
    try {
        let userName = req.body.username;
        let password = req.body.password;
        let correctCredentials = await authenticate(connection, userName, password);
        if (correctCredentials) {
            res.send(correctCredentials);
        } else {
            res.send('');
        }
    } finally {
        connection.release()
    }
});


//app.use(express.bodyParser());
app.get('/', (req, res) => {
    res.send('Hello from App Enginey!');
});


/**
 * Get a list of current games
 */
app.get('/games', async (req, res) => {
    let connection = await getConnection();
    try {
        let games = await getGames(connection);
        res.send(games);
    } finally {
         connection.release()
    }
});


/**
 * Get the details for a game
 */
app.get('/game/:id', async (req, res) => {
    let connection = await getConnection();
    try {
        let id = req.params.id;
        let game = await getGame(connection, id);
        res.send(game);
    }  finally {
        connection.release()
    }
});


/**
 * Delete a game
 */
app.delete('/game/:name', async (req, res) => {
    let connection = await getConnection();
    try{
        let name=req.params.name;
        let game = await deleteGame(connection,name);
        res.send(game);
    }  finally {
        connection.release()
    }
});


/**
 * Store a game
 */
app.put('/game/:id', async (req, res) => {
    let connection = await getConnection();
    try {
        let obj = req.body;
        delete obj.ID;
        let game = await updateGame(connection,obj);
        res.send(game);
    }  finally {
        connection.release()
    }
});

/**
 * Add a new game, or update it if it already exists
 */
app.post('/games', async (req,res) => {
    console.log(req.body);;
    let connection =  await getConnection();
    try {
        if (!req.body.name) {
            res.statusCode = 422;
            return;
        }
        await addGame(connection,req.body.name).then((response) => {
            res.send(response);
        }).catch((err) => {
            return false;
        });
    }  finally {
        connection.release()
    }
});

/**
 * Add player to a game
 */
app.post('/game/:gameId/players', async (req,res) => {
    // console.log(req.body);;
    let connection =  await getConnection();
    try {
        let gameId = req.params.gameId;
        let playerId = req.body.id;
        if (!playerId) {
            res.statusCode = 422;
            res.send();
            return;
        }
        await addPlayerToGame(connection, gameId, playerId).then((response) => {
            res.send(response);
        }).catch((err) => {
            res.statusCode = 422; // Unprocessable Entity
        });
    } finally {
        connection.release()
    }

});


/**
 * Get the players in a game
 */
app.get('/game/:id/players', async (req,res) => {
    // console.log(req.body);;
    let connection = await getConnection();
    try {
        let id = req.params.id;
        let players  = await getPlayersInGame(connection,id);
        res.send(players);
    } finally {
        connection.release()
    }

});


/**
 * Update details of a player in the game
 */
app.put('/game/:gameName/players', async (req,res) => {
    // console.log(req.body);;
    let connection =  await getConnection();
    try {
        let gameName = req.params.gameName;
        let player = req.body;
        if (!player.name) {
            res.statusCode = 422;
            return;
        }
        await updatePlayerInGame(connection,gameName,player).then((response) => {
            res.send(response);
        }).catch((err) => {
            res.statusCode = 422; // Unprocessable Entity
        });
    } finally {
        connection.release()
    }
});


/**
 * Delete a player from a game
 */
app.delete(`/game/:gameId/players/:playerId`, async (req,res) => {
    let connection =  await getConnection();
    try {
        let gameId = req.params.gameId;
        let playerId = req.params.playerId;
        await deletePlayerFromGame(connection,gameId,playerId).then((response) => {
            res.send(response);
        }).catch((err) => {
            res.statusCode = 422; // Unprocessable Entity
        });
    } finally {
        connection.release()
    }

});


/**
 * Get a list of users
 */
app.get('/users', async(req,res) => {
    let connection = await getConnection();
    try {
        let users = await getUsers(connection);
        res.send(users);
    } finally {
        connection.release()
    }
});


/**
 * Add a new user, or throw an error if a game of the specified name already exists
 */
app.post('/users', async (req,res) => {
    console.log(req.body);;
    let connection =  await getConnection();
    try {
        let userName = req.body.username;
        let password = req.body.password;
        let isAdmin = req.body.isAdmin;
        await addUser(connection,userName,password,isAdmin).then((response) => {
            res.send(response);
        }).catch((err) => {
            res.statusCode = 422; // Unprocessable Entity
        });
    } finally {
        connection.release()
    }
});


/**
 * update a user
 */
app.put('/users', async (req,res) => {
    console.log(req.body);;
    let connection =  await getConnection();
    try {
        let userObj = req.body;
        await updateUser(connection,userObj).then((response) => {
            res.send(response);
        }).catch((err) => {
            res.statusCode = 422; // Unprocessable Entity
        });
    } finally {
        connection.release()
    }
});

/**
 * Get horses for player
 */
app.get("/game/:gameId/horsesFor/:playerId", async(req,res) => {
    let gameId = req.params.gameId;
    let playerId = req.params.playerId;
    let connection = await getConnection();
    try {
        await getHorsesForPlayer(connection,gameId,playerId).then((response) => {
            res.send(response);
        }).catch((err) => {
            console.log("error getting horses for player: " + err);;
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Get horses in race
 */
app.get("/game/:gameId/horsesInRace/:raceId", async(req,res) => {
    let gameId = req.params.gameId;
    let raceId = req.params.raceId;
    let connection = await getConnection();
    try {
        await getHorsesForRace(connection,gameId,raceId).then((response) => {
            res.send(response);
        }).catch((err) => {
            console.log("error getting horses for race: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Add horse to a race
 */
app.post("/game/:gameId/horses/:raceId/:horseId/:playerId", async(req,res) => {
    let gameId = req.params.gameId;
    let raceId = req.params.raceId;
    let horseId = req.params.horseId;
    let playerId = req.params.playerId;
    let connection = await getConnection();
    try {
        await addHorseToRace(connection,gameId,raceId,horseId, playerId).then((response) => {
            res.send(response);
        }).catch((err) => {
            console.log("error adding horse to race");
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Save horses for player
 */
app.post("/game/:gameId/horsesFor/:playerId", async(req,res) => {
    let gameId = req.params.gameId;
    let playerId = req.params.playerId;
    let horses = req.body;
    let connection = await getConnection();
    try {
        await saveHorsesForPlayer(connection,gameId,playerId, horses).then((response) => {
            res.send(response);
        }).catch((err) => {
            global.console.log("error getting horses for player");
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Get selected player horses for meeting
 */
app.get("/playerHorseSelection/:gameId/:playerId/:meetingId", async(req,res) => {
    let gameId = req.params.gameId;
    let playerId = req.params.playerId;
    let meetingId = req.params.meetingId;

    let connection = await getConnection();
    try {
        await getPlayerHorsesForMeeting(connection,meetingId,gameId,playerId).then((response) => {
            res.send(response);
        }).catch((err) => {
            console.log("error getting horses for player: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Get horse form
 * @type {string|number}
 */
app.get("/game/:gameId/horseForm/:horseId", async (req,res) => {
    let horseId = req.params.horseId;
    let gameId = req.params.gameId;
    let connection = await getConnection();
    try {
        await getHorseForm(connection,gameId,horseId).then((response) => {
            res.send(response);
        }).catch((err) => {
            console.log("error getting horses for player");
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Get all bets from game
 * @type {string|number}
 */
app.get("/game/:gameId/bets/:raceId", async (req,res) => {

    let raceId = req.params.raceId;
    let gameId = req.params.gameId;
    let connection = await getConnection();
    try {
        await getBetsForRace(connection, gameId, raceId).then((response) => {
            res.send(response);
        }).catch((err) => {
            console.log("Error getting horses for player: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Get all meetings
 */
app.get("/meetings", async(req,res) => {
   let connection = await getConnection();
   try {
       await getMeetings(connection).then(async(response) => {
           res.send(response);
       }).catch((err)=> {
           console.log("Error getting meetings: " + err);
           return false;
       });
   } finally {
       connection.release()
   }
});


/**
 * Get races in meeting
 */
app.get("/meeting/:meetingId", async(req,res) => {
    let meetingId = req.params.meetingId;

    let connection = await getConnection();
    try {
        await getRacesInMeeting(connection,meetingId).then((response) => {
            res.send(response);
            // connection.release()
        }).catch((err) => {
            console.log("Error getting horses for player: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Get information for a particular race
 */
app.get("/raceInfo/:raceId", async(req,res) => {
    let raceId = req.params.raceId;

    let connection = await getConnection();
    try {
        await getRaceInfo(connection,raceId).then((response) => {
            res.send(response[0]);
            // connection.release()
        }).catch((err) => {
            console.log("Error getting horses for player: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Return true if all players have finished choosing horses
 */
app.get(`/meetingSelectionsReady/:meetingId/game/:gameId`, async(req,resp) => {
    let meetingId = req.params.meetingId;
    let gameId = req.params.gameId;
    let connection = await getConnection();
    try {
        await getMeetingSelectionsReady(connection, meetingId, gameId).then((response) => {
            resp.send(response);
            // connection.release()
        }).catch((err) => {
            console.log("Error getting horses for player: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Store a bet for a player
 * @type {string|number}
 */
app.post('/bets', async(req,resp) => {
    const betObj = req.body;
    const connection = await getConnection();
    try {
        await storeBet(connection,betObj).catch((err) => {
            console.log("Error storing bet: " + err);
            resp.send(false);
        }).then((data) => {
            if (data) {
                resp.send(true);
            }
        });
    } finally {
        connection.release();
    }
});

/**
 * Retrieve bets for a race
 */
app.get('/bets/game/:gameId/race/:raceId', async(req,resp) => {
    const gameId = req.params.gameId;
    const raceId = req.params.raceId;
    const connection = await getConnection();
    try {
        await getBets(connection, {GAME_ID:gameId, RACE_ID: raceId}).catch((err) => {
            console.log("Error fetching bets: " + err);
            resp.send();
        }).then((data) => {
           resp.send(data);
        });
    } finally {
        connection.release();
    }
});



/**
 * set state for a player
 */
app.post('/plyrState/:playerId/game/:gameId/state/:stateVal', async(req,resp) => {
    const gameId = req.params.gameId;
    const playerId = req.params.playerId;
    const state = req.params.stateVal;
    const connection = await getConnection();
    try {
        await setPlayerState(connection,gameId,playerId,state).catch( err => {
            console.log("Error fetching bets: " + err);
            resp.send();
        }).then((data) => {
            resp.send(data);
        });
    } finally {
        connection.release();
    }
});



/**
 * Retrieve bets for a player for a race
 */
app.get('/bets/game/:gameId/race/:raceId/player/:playerId', async(req,resp) => {
    const gameId = req.params.gameId;
    const raceId = req.params.raceId;
    const playerId = req.params.playerId;
    const connection = await getConnection();
    try {
        await getBets(connection, {GAME_ID:gameId, RACE_ID: raceId, PLAYER_ID: playerId}).catch((err) => {
            console.log("Error fetching bets: " + err);
            resp.send();
        }).then((data) => {
            resp.send(data);
        });
    } finally {
        connection.release();
    }
});


/**
 * get count of players with particular state
 */
app.get('/playerStates/:gameId/state/:state', async(req,resp) => {
    const gameId = req.params.gameId;
    const state = req.params.state;
    const connection = await getConnection();
    try {
        await getPlayerCountWithState(connection,gameId,state).catch( err => {
            console.log("Error fetching bets: " + err);
            resp.send();
        }).then((data) => {
            resp.send(data[0]);
        });
    } finally {
        connection.release();
    }
});




// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
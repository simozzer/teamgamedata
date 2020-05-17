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
    connectionLimit : 100, //important
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


executeQuery = async(connection,query,queryParams) => {
    return await new Promise((resolve,reject) => {
        if (queryParams) {
            connection.query(query,queryParams,  (err,rows) => {
                if(err) {
                    console.log(err);
                    reject(err);
                }
                resolve(rows);
            });

        } else {
            connection.query(query,  (err,rows) => {
                if(err) {
                    console.log(err);
                    reject(err);
                }
                resolve(rows);
            });

        }
    });
}


getGames = async (connection) => {
   const sql = 'CALL getGames()';
   return await executeQuery(connection,sql);
}


getUsers = async (connection) => {
    const sql = 'CALL getUsers()';
    return await executeQuery(connection,sql);
}


getRobots = async (connection) => {
    const sql = 'CALL getRobots()';
    return await executeQuery(connection,sql);
}



getGame = async (connection,id) => {
    const sql = 'CALL getGame(?)';
    return await executeQuery(connection,sql, [id]).then((rows) => {
        if (rows && rows.length && rows[0].length) {
            return rows[0][0];
        } else {
            return [];
        }
    }).catch(err => {
        console.log('Error getting game: ' + err);
        return false;
    })

}


updateGameIndexes = async (connection,gameId, meeting_index, race_index) => {
    const query = 'CALL updateGameIndexes(?,?,?)'
    return await executeQuery(connection,query,[race_index, meeting_index, gameId]);
}


setPlayerState = async(connection, gameId, playerId, state) => {
    const query = 'CALL setPlayerState(?,?,?)';
    return await executeQuery(connection,query,[playerId,gameId,state]);
}

setGameState = async(connection, gameId, state)  => {
    const query = 'CALL setGameStatus(?,?)';
    return await executeQuery(connection,query,[gameId,state]);
}


getPlayerState = async(connection, gameId, playerId) => {
    const query = 'CALL getPlayerState(?,?,?)';
    return await executeQuery(connection,query,[playerId,gameId,state]).then(res => {
       if (res && res.length) {
           return res[0];
       } else {
           return [];
       }
    });
}


getPlayerCountWithState = async(connection, gameId, state) => {
    let query  = `SELECT COUNT(*) as COUNT FROM PLAYER_STATES WHERE GAME_ID=${gameId} AND STATE = ${state};`;

    let result = await executeQuery(connection,query);

    query = `SELECT PLAYER_ID, U.NAME, STATE  FROM PLAYER_STATES PS ` +
        `INNER JOIN USERS U on PS.PLAYER_ID = U.ID ` +
        `WHERE GAME_ID=${gameId};`;

    result[0].playerStates = await executeQuery(connection,query);
    return result;
}



deleteGame = async(connection, name) => {
    const query = 'CALL deleteGame(?);';
    return await executeQuery(connection,query,[name]);
}


addGame = async (connection, name, playerId) => {
    const sql = 'CALL addGame(?,?)';
    return await executeQuery(connection,sql, [name,playerId]).then((rows) => {
        if (rows && rows.length && rows[0].length) {
            return rows[0][0];
        } else {
            return [];
        }
    }).catch(err => {
        console.log('Error adding game: ' + err);
        return false;
    });
}

/**
 * Adds a player to a named game
 * @param connection
 * @param gameName
 * @param playerObj
 * @returns {Promise<any>}
 */
addPlayerToGame = async (connection, gameId, playerId) => {
    const sql = 'CALL addPlayerToGame(?,?)';
    return await executeQuery(connection, sql, [playerId, gameId]).then((rows) => {
        if (rows && rows.length && rows[0].length) {
            return rows[0];
        } else {
            return [];
        }
    }).catch(err => {
        console.log('Error adding game: ' + err);
    });
}


getPlayersInGame = async(connection,gameId) => {
    const query = 'CALL getPlayersInGame(?)';
    return await executeQuery(connection,query,[gameId]).then((res) => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
}


addUser = async (connection, username, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'CALL addUser(?,?)';
        connection.query(sql, [username, password], (error, results) => {
            if (error) {
                reject(error);
            }
            resolve(results[0]);
        });
    });
}

/**
 * Removes a named player from a named game
 * @param connection
 * @param gameName
 * @param playerName
 * @returns {Promise<T>}
 */
deletePlayerFromGame = async (connection,gameId,playerId) => {
    const sql = 'CALL deletePlayerFromGame(?,?)';
    return await executeQuery(connection, sql, [gameId, playerId]).then((rows) => {
        if (rows && rows.length && rows[0].length) {
            return rows[0];
        } else {
            return [];
        }
    }).catch(err => {
        console.log('Error adding game: ' + err);
    });
};


authenticate =  async (connection,userName,password) => {

    return new Promise(async(resolve, reject) => {
        const sql = 'CALL authenticate(?,?)';
        return await executeQuery(connection,sql,[userName,password]).then((rows) => {
            if (rows && rows.length)  {
                resolve(rows[0]);
            } else {
                resolve(false);
            }
        }).catch((err) => {
            console.log("Error in authenticate: " + err);
        })
    });
}


getHorsesForPlayer = async (connection, gameId, playerId) => {
    const sql = 'CALL getHorsesForPlayer(?,?)';
    return await executeQuery(connection, sql, [gameId, playerId]).then((rows) => {
        if (rows && rows.length && rows[0].length) {
            return rows[0];
        } else {
            return [];
        }
    }).catch(err => {
        console.log('Error adding game: ' + err);
    });
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
    let query = 'CALL deleteHorsesForPlayer(?,?)'
    let result = await executeQuery(connection,query,[gameId, playerId]);
    if (result) {
        // save each horse
        for (const horse of horses) {
            query = 'CALL addHorseForPlayer(?, ?,?,?,?,?,?,?)';

             await executeQuery(connection,query, [
                horse.NAME,
                horse.HORSE_TYPE,
                horse.SPEED_FACTOR,
                horse.SLOWER_SPEED_FACTOR,
                horse.ENERGY_FALL_DISTANCE,
                horse.GOING_TYPE,
                gameId,
                playerId]).catch( (err) => {
                    throw "Failed to insert horse details: " + err;
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
    const query = 'CALL getPlayerHorsesForMeeting(?,?,?)';
    return await executeQuery(connection,query,[meetingId,playerId,gameId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
}

/**
 * Get the form for a horse
 */
getHorseForm = async (connection,gameId,horseId) => {
    const query = 'CALL getHorseForm(?,?)';
    return await executeQuery(connection,query,[gameId, horseId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    })
}

/**
 * Save the form for a horse in a race
 */
saveHorseForm = async(connection,gameId,raceId,horseId, position, going) => {
    const query = 'CALL saveHorseForm(?,?,?,?,?)';
    return await executeQuery(connection,query, [gameId, raceId, horseId, position, going]);
}


/**
 * Get all bets for a race
 * @param connection
 * @param gameId
 * @param raceId
 * @returns {Promise<*>}
 */
getBetsForRace = async (connection,gameId, raceId) => {
    const query = 'CALL getBetsForRace(?,?)';
    return await executeQuery(connection,query,[meetingId,raceId,gameId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
}


getPlayerBetsForRace = async (connection,gameId, raceId, playerId) => {
    const query = 'CALL getBetsForRace(?,?, playerId)';
    return await executeQuery(connection,query,[meetingId,raceId,gameId, playerId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
}


clearBetsForRace = async (connection, gameId, raceId) => {
    const query = `CALL clearBetsForRace(?,?);`;
    return await executeQuery(connection,query,[gameId, raceId]);
}


getMeetings = async(connection, gameId) => {
    const query = 'CALL getMeetings(?)';
    return await executeQuery(connection,query,[gameId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
}


getRacesInMeeting = async(connection, meetingId) => {
    const query = 'CALL getRacesInMeeting(?)';
    return await executeQuery(connection,query,[meetingId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
}


getRaceInfo = async(connection, raceId, gameId) => {
    const query = 'CALL getRaceInfo(?,?)';
    return await executeQuery(connection,query,[raceId, gameId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
}


getHorsesForRace = async(connection, gameId, raceId) => {
    const query = 'CALL getHorsesForRace(?,?)';
    return await executeQuery(connection,query,[raceId, gameId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
}


clearPlayerHorseSelectionForMeeting = async (connection, playerId, gameId, meetingId) => {
    query = 'CALL clearPlayerHorseSelectionForMeeting(?,?,?)';
    return await executeQuery(connection,query,[playerId,gameId,meetingId]);

}


addHorseToRace = async(connection, gameId, raceId, horseId, playerId) => {
    const sql = 'CALL addHorseToRace(?,?,?,?)';
    return await executeQuery(connection, sql, [gameId, raceId, horseId, playerId]).then((rows) => {
        if (rows && rows.length && rows[0].length) {
            return rows[0];
        } else {
            return [];
        }
    }).catch(err => {
        console.log('Error adding horse to race: ' + err);
    });
}


getPlayersWithoutSelections = async(connection, meetingId, gameId) => {
    const query = 'CALL getPlayersWithoutSelections(?,?)';
    return await executeQuery(connection,query,[meetingId, gameId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
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
        playersWithSelectionsCount = response[0].C;
        query = `SELECT COUNT(PLAYER_ID) as C FROM GAME_PLAYERS WHERE GAME_ID = ${gameId};`;
        return await executeQuery(connection,query).catch((err) => {
            console.log("Error getting count of selections made for meeting: " + err);
            return false;
        }).then(async(response) => {
            if (response[0].C === playersWithSelectionsCount) {
                return {ready: true}
            } else {
                return getPlayersWithoutSelections(connection,meetingId, gameId);
            }
        })
    })
}


storeBet = async(connection, betObject) => {
    const sql = 'CALL storeBet(?,?,?,?,?,?,?);';
    return await executeQuery(connection, sql, [betObject.PLAYER_ID, betObject.HORSE_ID, betObject.RACE_ID,
        betObject.GAME_ID, betObject.TYPE, betObject.AMOUNT, betObject.ODDS]).then((rows) => {
        if (rows && rows.length && rows[0].length) {
            return rows[0];
        } else {
            return [];
        }
    }).catch(err => {
        console.log('Error adding horse to race: ' + err);
    });

}

const getBets = async(connection, queryObj) => {
    let query;

    if (queryObj.RACE_ID && queryObj.GAME_ID) {

        let sp;
        if (queryObj.PLAYER_ID) {
            query = 'CALL getPlayerBetsForRace(?,?,?)';
            return await executeQuery(connection,query,[queryObj.RACE_ID, queryObj.GAME_ID, queryObj.PLAYER_ID])
                 .then(res => {
                     if (res && res.length) {
                         return res[0];
                     } else {
                         return [];
                     }
                 });
        } else {
            query = 'CALL getBetsForRace(?,?)';
            return await executeQuery(connection,query,[queryObj.RACE_ID, queryObj.GAME_ID])
                .then(res => {
                        if (res && res.length) {
                            return res[0];
                        } else {
                            return [];
                        }
                });
        }
    } else {
        query = 'SELECT B.PLAYER_ID, U.NAME as PLAYER_NAME, B.HORSE_ID, H.NAME as HORSE_NAME, ' +
            'B.RACE_ID, B.GAME_ID, B.AMOUNT, B.TYPE, B.ODDS FROM BETS B ' +
            'INNER JOIN USERS U on B.PLAYER_ID = U.ID ' +
            'INNER JOIN HORSES H on B.HORSE_ID = H.ID ' +
            'INNER JOIN RACES R on B.RACE_ID = R.ID ';
        return await executeQuery(connection,query).then(res => {
            if (res && res.length) {
                return res[0];
            } else {
                return  [];
            }
        });
    }

}


adjustPlayerFunds = async (connection,gameId,playerId, adjustment) => {
    const sql = 'CALL adjustPlayerFunds(?,?,?);';
    return await executeQuery(connection, sql, [gameId, playerId, adjustment]).then((rows) => {
        if (rows && rows.length && rows[0].length) {
            return rows[0];
        } else {
            return [];
        }
    }).catch(err => {
        console.log('Error adjusting player funds: ' + err);
    });
}


getPlayerFunds = async (connection,gameId,playerId, adjustment) => {
    const query = 'CALL getPlayerFunds(?,?)';
    return await executeQuery(connection,query,[gameId, playerId]).then( res => {
        if (res && res.length) {
            return res[0];
        } else {
            return [];
        }
    });
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
        if (correctCredentials && correctCredentials.length) {
            res.send(correctCredentials[0]);
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
        if (games && games.length) {
            res.send(games[0]);
        } else {
            res.send([]);    
        }
        
    } finally {
         connection.release()
    }
});

/**
 * Get a list of current games
 */
app.post('/gameIndexes', async (req, res) => {
    let connection = await getConnection();
    let gameObj = req.body;
    try {
        let games = await updateGameIndexes(connection, gameObj.ID, gameObj.MEETING_INDEX, gameObj.RACE_INDEX);
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
 * update game status
 */
app.put('/gameState', async (req, res) => {
    let connection = await getConnection();
    try {
        let obj = req.body;
        await setGameState(connection,obj.ID, obj.STATE).then( data => {
            res.send(data);
        }, err => {
            console.log("error setting game status: " + err);
            res.send(false);
        });

    }  finally {
        connection.release()
    }
});

/**
 * Add a new game, or update it if it already exists
 */
app.post('/games', async (req,res) => {
    let connection =  await getConnection();
    try {
        if (!req.body.name) {
            res.statusCode = 422;
            return;
        }
        await addGame(connection,req.body.name, req.body.ownerId).then((response) => {
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
app.post('/game/:gameId/players', (req,res) => {
    getConnection().then((connection) => {
        try {
            let gameId = req.params.gameId;
            let playerId = req.body.id;
            if (!playerId) {
                res.statusCode = 422;
                res.send();
                return;
            }
            addPlayerToGame(connection, gameId, playerId).then((response) => {
                res.send(response);
            }).catch((err) => {
                res.statusCode = 422; // Unprocessable Entity
            });
        } finally {
            connection.release()
        }
    });


});


/**
 * Get the players in a game
 */
app.get('/game/:id/players', async (req,res) => {
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
    let connection =  await getConnection();
    try {
        let gameName = req.params.gameName;
        let player = req.body;
        if (!player.name) {
            res.statusCode = 422;
            return;
        }
        await addPlayerToGame(connection,gameName,player).then((response) => {
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
        if (users && users.length) {
            res.send(users[0]);
        } else {
            res.send([]);
        }
    } finally {
        connection.release()
    }
});



/**
 * Get a list of robotss
 */
app.get('/robots', async(req,res) => {
    let connection = await getConnection();
    try {
        let users = await getRobots(connection);
        if (users && users.length) {
            res.send(users[0]);
        } else {
            res.send([]);
        }
    } finally {
        connection.release()
    }
});


/**
 * Add a new user, or throw an error if a game of the specified name already exists
 */
app.post('/users', async (req,res) => {
    let connection =  await getConnection();
    try {
        let userName = req.body.username;
        let password = req.body.password;
        await addUser(connection,userName,password).then((response) => {
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
            console.log("error saving horses for player");
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
            console.log("error getting horse form");
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Save form for a horse
 */
app.post("/game/:gameId/horseForm/:raceId/:horseId/:position", async (req,res) => {
    let gameId = req.params.gameId;
    let raceId = req.params.raceId;
    let horseId = req.params.horseId;
    let position = req.params.position;
    let going = req.body.going;
    let connection = await getConnection();
    try {
        await saveHorseForm(connection,gameId,raceId,horseId, position, going).then((response) => {
            res.send(response);
        }).catch((err) => {
            console.log("error saving horse form");
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
            console.log("Error getting bets for game: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Clear bets ALL bets for a race
 * @type {string|number}
 */
app.delete("/game/:gameId/bets/:raceId", async (req,res) => {

    let raceId = req.params.raceId;
    let gameId = req.params.gameId;
    let connection = await getConnection();
    try {
        await clearBetsForRace(connection, gameId, raceId).then((response) => {
            res.send(response);
        }).catch((err) => {
            console.log("Error getting player bets for race: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Get all meetings
 */
app.get("/meetings/:gameId", async(req,res) => {
   let connection = await getConnection();
   let gameId = req.params.gameId;
   try {
       await getMeetings(connection, gameId).then(async(response) => {
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
            console.log("Error getting races in meeting: " + err);
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
            console.log("Error getting meeting selections ready: " + err);
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
 * get state for a player
 */
app.get('/plyrState/:playerId/game/:gameId', async(req,resp) => {
    const gameId = req.params.gameId;
    const playerId = req.params.playerId;
    const connection = await getConnection();
    try {
        await getPlayerState(connection,gameId,playerId).catch( err => {
            console.log("Error fetching player state: " + err);
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
app.post('/playerState', async(req,resp) => {
    const gameId = req.body.gameId;
    const playerId = req.body.playerId;
    const state = req.body.stateVal;
    const connection = await getConnection();
    try {
        await setPlayerState(connection,gameId,playerId,state).catch( err => {
            console.log("Error fetching player state: " + err);
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

/**
 * Adjust funds for a player
 */
app.post('/playerFunds/:gameId/:playerId/:adjustment', async(req,resp) => {
    const gameId = req.params.gameId;
    const playerId = req.params.playerId;
    const adjustment = req.params.adjustment;
    const connection = await getConnection();
    try {
        await adjustPlayerFunds(connection,gameId,playerId,adjustment).catch( err => {
            console.log("Error adjusting funds: " + err);
            resp.send();
        }).then((data) => {
            resp.send(data);
        });
    } finally {
        connection.release();
    }
});


/**
 * get funds for a player
 */
app.get('/playerFunds/:gameId/:playerId', async(req,resp) => {
    const gameId = req.params.gameId;
    const playerId = req.params.playerId;
    const connection = await getConnection();
    try {
        await getPlayerFunds(connection, gameId, playerId).catch(err => {
            console.log("Error getting funds: " + err);
            resp.send();
        }).then((data) => {
            resp.send(data[0]);
        });
    } finally {
        connection.release();
    }
});



/**
 * clear meeting horses for player
 */
app.post("/delHorse", async(req,res) => {
    let gameId = req.body.gameId;
    let playerId = req.body.playerId;
    let meetingId = req.body.meetingId;
    let connection = await getConnection();
    try {
        await clearPlayerHorseSelectionForMeeting(connection,gameId,playerId, meetingId).then((response) => {
            res.send({result:"ok"});
        }).catch((err) => {
            console.log("error clearing horses for player");
            return false;
        });
    } finally {
        connection.release()
    }
});


/**
 * Get information for a particular race
 */
app.get("/RINFO/:raceId", async(req,res) => {
    console.log("here");
    let raceId = req.params.raceId;
    let gameId = req.query.g;
    let connection = await getConnection();
    try {
        await getRaceInfo(connection,raceId,gameId).then((response) => {
            res.send(response[0]);
            // connection.release()
        }).catch((err) => {
            console.log("Error getting race information: " + err);
            return false;
        });
    } finally {
        connection.release()
    }
});



// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
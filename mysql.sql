/////
////
mysql -u root -p

UPDATE mysql.user SET Password = PASSWORD('<< your value here>>') WHERE User = 'root';

FLUSH PRIVILEGES;

CREATE DATABASE teamGames;

INSERT INTO mysql.user (User,Host,authentication_string,ssl_cipher,x509_issuer,x509_subject) VALUES('team','localhost',PASSWORD('team'),'','','');

INSERT INTO mysql.user (User,Host,authentication_string,ssl_cipher,x509_issuer,x509_subject)
VALUES('team','%',PASSWORD('team'),'','','');

FLUSH PRIVILEGES;

GRANT ALL PRIVILEGES ON teamGames.* to team@localhost identified by 'team';

GRANT ALL PRIVILEGES ON teamGames.* to team@% identified by 'team';

FLUSH PRIVILEGES;

////
////


create schema if not exists teamGames collate latin1_swedish_ci;

create table if not exists GAMES
(
	ID int auto_increment
		primary key,
	NAME varchar(255) not null,
	STATE int not null,
	MEETING_INDEX int default -1 not null,
	RACE_INDEX int default -1 not null,
	OWNER_ID int not null,
	constraint NAME
		unique (NAME)
);

create table if not exists GOING_TYPES
(
	ID int not null
		primary key,
	NAME varchar(50) not null,
	constraint GOING_TYPES_NAME_uindex
		unique (NAME)
);

create table if not exists HORSES
(
	ID int auto_increment
		primary key,
	NAME varchar(255) not null,
	HORSE_TYPE int not null,
	SPEED_FACTOR float not null,
	SLOWER_SPEED_FACTOR float not null,
	ENERGY_FALL_DISTANCE float not null,
	GOING_TYPE int default 0 not null,
	constraint NAME
		unique (NAME),
	constraint HORSES_ibfk_1
		foreign key (GOING_TYPE) references GOING_TYPES (ID)
			on delete cascade
);

create index FK_HORSE_GOING
	on HORSES (GOING_TYPE);

create table if not exists MEETINGS
(
	ID int auto_increment
		primary key,
	NAME varchar(255) not null,
	IMAGE_URL varchar(1024) default '' null
);

create table if not exists GAME_MEETINGS
(
	GAME_ID int not null,
	MEETING_ID int not null,
	GOING int not null,
	MEETING_STATE int default 0 not null,
	primary key (GAME_ID, MEETING_ID),
	constraint GAME_MEETINGS___fk_GOING
		foreign key (GOING) references GOING_TYPES (ID),
	constraint GAME_MEETINGS_ibfk_1
		foreign key (GAME_ID) references GAMES (ID)
			on delete cascade,
	constraint GAME_MEETINGS_ibfk_2
		foreign key (MEETING_ID) references MEETINGS (ID)
			on delete cascade
);

create index MEETING_ID
	on GAME_MEETINGS (MEETING_ID);

create table if not exists RACES
(
	ID int auto_increment
		primary key,
	NAME varchar(255) not null,
	LENGTH_FURLONGS int not null,
	PRIZE int default 1 not null
);

create table if not exists HORSE_FORM
(
	HORSE_ID int not null,
	RACE_ID int not null,
	GAME_ID int not null,
	POSITION int not null,
	RACE_INDEX int not null,
	GOING int not null,
	primary key (HORSE_ID, RACE_ID, GAME_ID),
	constraint HORSE_FORM___fk_GOING
		foreign key (GOING) references GOING_TYPES (ID),
	constraint HORSE_FORM_ibfk_1
		foreign key (HORSE_ID) references HORSES (ID)
			on delete cascade,
	constraint HORSE_FORM_ibfk_2
		foreign key (RACE_ID) references RACES (ID)
			on delete cascade,
	constraint HORSE_FORM_ibfk_3
		foreign key (GAME_ID) references GAMES (ID)
			on delete cascade
);

create index GAME_ID
	on HORSE_FORM (GAME_ID);

create index RACE_ID
	on HORSE_FORM (RACE_ID);

create table if not exists MEETING_RACES
(
	MEETING_ID int not null,
	RACE_ID int not null,
	constraint MEETING_RACES_ibfk_1
		foreign key (MEETING_ID) references MEETINGS (ID)
			on delete cascade,
	constraint MEETING_RACES_ibfk_2
		foreign key (RACE_ID) references RACES (ID)
			on delete cascade
);

create index MEETING_ID
	on MEETING_RACES (MEETING_ID);

create index RACE_ID
	on MEETING_RACES (RACE_ID);

create table if not exists ROLES
(
	ID int auto_increment
		primary key,
	NAME varchar(255) not null,
	constraint NAME
		unique (NAME)
);

create table if not exists USERS
(
	ID int auto_increment
		primary key,
	NAME varchar(255) not null,
	PASSWORD varchar(255) not null,
	constraint NAME
		unique (NAME)
);

create table if not exists GAME_PLAYERS
(
	GAME_ID int not null,
	PLAYER_ID int not null,
	FUNDS int not null,
	primary key (GAME_ID, PLAYER_ID),
	constraint GAME_PLAYERS_ibfk_1
		foreign key (GAME_ID) references GAMES (ID)
			on delete cascade,
	constraint GAME_PLAYERS_ibfk_2
		foreign key (PLAYER_ID) references USERS (ID)
			on delete cascade
);

create table if not exists BETS
(
	PLAYER_ID int not null,
	HORSE_ID int not null,
	RACE_ID int not null,
	GAME_ID int not null,
	AMOUNT int not null,
	TYPE int not null,
	ODDS decimal not null,
	primary key (PLAYER_ID, HORSE_ID, RACE_ID, GAME_ID, TYPE),
	constraint BETS_ibfk_1
		foreign key (PLAYER_ID) references USERS (ID)
			on delete cascade,
	constraint BETS_ibfk_2
		foreign key (HORSE_ID) references HORSES (ID)
			on delete cascade,
	constraint BETS_ibfk_3
		foreign key (RACE_ID) references RACES (ID)
			on delete cascade,
	constraint BETS_ibfk_4
		foreign key (GAME_ID) references GAMES (ID)
			on delete cascade,
	constraint BETS_ibfk_5
		foreign key (GAME_ID, PLAYER_ID) references GAME_PLAYERS (GAME_ID, PLAYER_ID)
			on delete cascade
);

create index HORSE_ID
	on BETS (HORSE_ID);

create index PLAYER_ID
	on BETS (PLAYER_ID, GAME_ID);

create index RACE_ID
	on BETS (RACE_ID);

create index PLAYER_ID
	on GAME_PLAYERS (PLAYER_ID);

create table if not exists HORSES_IN_RACE
(
	GAME_ID int not null,
	RACE_ID int not null,
	HORSE_ID int not null,
	PLAYER_ID int not null,
	primary key (GAME_ID, RACE_ID, HORSE_ID, PLAYER_ID),
	constraint ONE_HORSE_PER_PLAYER_PER_RACE
		unique (GAME_ID, PLAYER_ID, RACE_ID),
	constraint HORSES_IN_RACE_ibfk_1
		foreign key (GAME_ID) references GAMES (ID)
			on delete cascade,
	constraint HORSES_IN_RACE_ibfk_2
		foreign key (RACE_ID) references RACES (ID)
			on delete cascade,
	constraint HORSES_IN_RACE_ibfk_3
		foreign key (HORSE_ID) references HORSES (ID)
			on delete cascade,
	constraint HORSES_IN_RACE_ibfk_4
		foreign key (GAME_ID, PLAYER_ID) references GAME_PLAYERS (GAME_ID, PLAYER_ID)
			on delete cascade
);

create index HORSE_ID
	on HORSES_IN_RACE (HORSE_ID);

create index RACE_ID
	on HORSES_IN_RACE (RACE_ID);

create table if not exists HORSE_OWNERSHIP
(
	HORSE_ID int not null
		primary key,
	GAME_ID int not null,
	PLAYER_ID int not null,
	constraint HORSE_OWNERSHIP_ibfk_1
		foreign key (HORSE_ID) references HORSES (ID)
			on delete cascade,
	constraint HORSE_OWNERSHIP_ibfk_2
		foreign key (GAME_ID) references GAMES (ID)
			on delete cascade,
	constraint HORSE_OWNERSHIP_ibfk_3
		foreign key (PLAYER_ID) references USERS (ID)
			on delete cascade
);

create index GAME_ID
	on HORSE_OWNERSHIP (GAME_ID);

create index PLAYER_ID
	on HORSE_OWNERSHIP (PLAYER_ID);

create table if not exists PLAYER_STATES
(
	PLAYER_ID int not null,
	GAME_ID int not null,
	STATE int default -1 not null,
	primary key (PLAYER_ID, GAME_ID),
	constraint PLAYER_STATES_ibfk_1
		foreign key (PLAYER_ID) references USERS (ID)
			on delete cascade,
	constraint PLAYER_STATES_ibfk_2
		foreign key (GAME_ID) references GAMES (ID)
			on delete cascade
);

create index GAME_ID
	on PLAYER_STATES (GAME_ID);

create table if not exists USER_ROLES
(
	USER_ID int not null,
	ROLE_ID int not null,
	primary key (USER_ID, ROLE_ID),
	constraint USER_ROLES_ibfk_1
		foreign key (USER_ID) references USERS (ID)
			on delete cascade,
	constraint USER_ROLES_ibfk_2
		foreign key (ROLE_ID) references ROLES (ID)
			on delete cascade
);

create index ROLE_ID
	on USER_ROLES (ROLE_ID);

create table if not exists USER_STATE_TYPES
(
	ID int not null
		primary key,
	NAME varchar(50) not null
);



INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (1, 'Flying Childers Stakes', 5, 100);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (2, 'St Ledger', 16, 100);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (3, 'Park Hill Stakes', 7, 100);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (4, '2000 Guineas', 8, 150);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (5, 'Challenge Stakes', 7, 150);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (6, 'Abernant Stakes', 6, 150);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (7, 'Chester Cup', 16, 250);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (8, 'Chester Vase', 8, 250);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (9, 'Huxley Stakes', 8, 250);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (10, 'Musidora Stakes', 8, 400);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (11, 'Yorkshire Oaks', 8, 400);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (12, 'Nunthorpe Stakes', 5, 400);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (13, 'Derby', 8, 600);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (14, 'Oaks', 8, 600);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (15, 'Surrey Stakes', 8, 600);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (16, 'Gold Cup', 16, 750);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (17, 'Coronation Stakes', 7, 750);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (18, 'Diamond Jubilee Stakes', 6, 750);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (19, 'Sussex Stakes', 8, 1000);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (20, 'Goodwood Cup', 16, 1000);
INSERT INTO teamGames.RACES (ID, NAME, LENGTH_FURLONGS, PRIZE) VALUES (21, 'Richmond Stakes', 6, 1000);

INSERT INTO teamGames.MEETINGS (ID, NAME, IMAGE_URL) VALUES (1, 'Doncaster', '');
INSERT INTO teamGames.MEETINGS (ID, NAME, IMAGE_URL) VALUES (2, 'New Market', '');
INSERT INTO teamGames.MEETINGS (ID, NAME, IMAGE_URL) VALUES (3, 'Chester', '');
INSERT INTO teamGames.MEETINGS (ID, NAME, IMAGE_URL) VALUES (4, 'York', '');
INSERT INTO teamGames.MEETINGS (ID, NAME, IMAGE_URL) VALUES (5, 'Epsom', '');
INSERT INTO teamGames.MEETINGS (ID, NAME, IMAGE_URL) VALUES (6, 'Royal Ascot', '');
INSERT INTO teamGames.MEETINGS (ID, NAME, IMAGE_URL) VALUES (7, 'Goodwood', '');


INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (1, 1);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (1, 2);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (1, 3);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (2, 4);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (2, 5);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (2, 6);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (3, 7);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (3, 8);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (3, 9);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (4, 10);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (4, 11);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (4, 12);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (5, 13);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (5, 14);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (5, 15);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (6, 16);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (6, 17);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (6, 18);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (7, 19);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (7, 20);
INSERT INTO teamGames.MEETING_RACES (MEETING_ID, RACE_ID) VALUES (7, 21);



INSERT INTO teamGames.GOING_TYPES(ID, NAME) VALUES(0,'FIRM');
INSERT INTO teamGames.GOING_TYPES(ID, NAME) VALUES(1,'GOOD');
INSERT INTO teamGames.GOING_TYPES(ID, NAME) VALUES(2,'SOFT');

INSERT INTO teamGames.USER_STATE_TYPES (ID, NAME) VALUES (0, 'START');
INSERT INTO teamGames.USER_STATE_TYPES (ID, NAME) VALUES (1, 'CREATE_HORSES');
INSERT INTO teamGames.USER_STATE_TYPES (ID, NAME) VALUES (2, 'SELECT_HORSES');
INSERT INTO teamGames.USER_STATE_TYPES (ID, NAME) VALUES (3, 'PLACE_BETS');
INSERT INTO teamGames.USER_STATE_TYPES (ID, NAME) VALUES (4, 'RACING');
INSERT INTO teamGames.USER_STATE_TYPES (ID, NAME) VALUES (5, 'RACE_END');
INSERT INTO teamGames.USER_STATE_TYPES (ID, NAME) VALUES (6, 'MEETING_END');



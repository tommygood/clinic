create table login_log(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`times` datetime default current_timestamp,
`ip` varchar(16),
`aId` int(3) default null
)

create table debt(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`times` datetime default current_timestamp,
`aId` int(11),
`turned` int(1) default 0,
`reason` varchar(50),
`money` int(8)
)

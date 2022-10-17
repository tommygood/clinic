create table expense(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`aId` int(11),
`emId` int(11) default null,
`rId` int(11) default null,
`cost` int(6),
`mark` varchar(20)
)

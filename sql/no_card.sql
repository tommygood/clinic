create table no_card(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`time` datetime default current_timestamp,
`return_time` datetime,
`rId` int(11),
`status` int(1) default 0,
`pId` int(11),
`aId` int(11)
)

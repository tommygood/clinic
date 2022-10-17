create table no_card(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`time` datetime default current_timestamp,
`rId` int(11),
`status` int(1) default 0
)

create table change_num(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`aId` int(11),
`rId` int(11),
`quantity` int(5),
`time` datetime default current_timestamp
)

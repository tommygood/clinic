create table delete_records(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`time` datetime default current_timestamp,
`aId` int(11),
`rId` int(11)
)

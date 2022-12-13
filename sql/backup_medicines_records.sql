create table backup_medicines_records(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`rId` int(11),
`medicines_id` int(11),
`day_num` float(5),
`days` int(2),
`rule` varchar(5),
`mark` varchar(5)
)

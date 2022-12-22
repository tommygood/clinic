create table medicines_records(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`rId` int(11),
`medicines_id` int(11),
`day_num` float,
`days` int(2),
`rule` varchar(5),
`mark` varchar(5),
`prescript` varchar(300)
)

create table done_financial(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`time` datetime default current_timestamp,
`money` int(8),
`details` varchar(500),
`is_true` int(1),
`origin_aId` int(11),
`next_aId` int(11),
`origin_log` varchar(150),
`next_log` varchar(150)
)

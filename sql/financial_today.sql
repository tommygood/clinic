create table financial_today(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`times` datetime default current_timestamp,
`aId` int(11),
`reason` varchar(50),
`money` int(8)
)

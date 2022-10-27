create table change_expenses(
`no` INT PRIMARY KEY AUTO_INCREMENT,
`time` datetime default current_timestamp,
`fId` int(11),
`aId` int(11),
`changed_price` int(11),
`reason` varchar(50)
)

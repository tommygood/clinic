create table each_use_medicines (
	`no` INT PRIMARY KEY AUTO_INCREMENT,
	`time` datetime default current_timestamp,
	`aId` int(11),
	`quantity` decimal(10,2),
	`reason` varchar(50),
	`mark` varchar(150),
    `emId` int(11),
    `code` varchar(10)
)
	

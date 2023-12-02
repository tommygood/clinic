function getId(id) {
	return document.getElementById(id);
}

function getTime(time) { // 不要最後的小數點
	var new_time = '';
	for (let i = 0;i < time.length-2;i++) {
		new_time += time[i];
	}
	return new_time;
}

document.addEventListener('DOMContentLoaded', async function() {
	const {data : main_pos} = await axios.get('/main_pos');
	var events = [] // 所有主責資料
	var color = ['green', 'yellow', 'red', 'brown', 'purple']; // 對應的顏色
	for (let i = 0;i < main_pos.length;i++) {
		if (main_pos[i].status)
			is_main = '(主責)';
		else
			is_main = '';
		console.log(is_main);
		in_json = {}; // 打包成 json
		in_json['title'] = main_pos[i].aId + "號護士 " + is_main;
		in_json['start'] = getTime(main_pos[i].start_time);
		in_json['end'] = getTime(main_pos[i].end_time);
		in_json['backgroundColor'] = color[main_pos[i].aId];
		in_json['borderColor'] = color[main_pos[i].aId];
		events.push(in_json); // 放入陣列
	}
	console.log(events);
	var calendarEl = document.getElementById('calendar');
	var calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: 'dayGridMonth',
		events, // 所有活動
		eventTimeFormat: { // like '14:30:00'
			hour: '2-digit',
			minute: '2-digit',
			meridiem: false
		}
	});
	calendar.render();
});

getId('form').addEventListener('submit', async(e) => {
	e.preventDefault();
	const {data : suc} = await axios.post('/fullcalendar/update', {is_main : getId('is_main').checked ? 1 : 0, aId : getId('aId').value, start : getId('start').value, end : getId('end').value});
	if (suc) {
		alert('更新成功');
		location.reload();
	}
	else {
		alert('更新失敗');
		location.reload();
	}
});

        function getId(id) {
            return document.getElementById(id);
        }

        getId('login').addEventListener('submit', async(e) => {
			e.preventDefault();
			const data = {
				account : getId('account').value,
				pass : getId('pass').value
			};
			const checked_data = await axios.post('/login/check', data);
			console.log(checked_data.data);
			if (checked_data.data.error != null) // 輸入為錯誤
				alert(checked_data.data.error);
			if (checked_data.data.aId != undefined) {
				if (checked_data.data.title == 'doc') {
					window.location.href = '/docMain';
				};
			};
        });

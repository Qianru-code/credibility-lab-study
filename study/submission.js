function enableStudySubmission(readResponse) {
  const submit = document.querySelector('#submit');
  const backup = document.querySelector('#backup');
  const status = document.querySelector('#status');
  submit.onclick = async () => {
    const result = readResponse();
    if (!result) return;
    submit.disabled = true;
    status.textContent = 'Sending your responses…';
    try {
      const response = await fetch('https://credibility-lab-responses.yqr1113.chatgpt.site/submit', {
        method: 'POST', headers: {'Content-Type':'text/plain;charset=UTF-8'},
        body: JSON.stringify(result.data), credentials: 'omit',
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) throw new Error('Request unsuccessful');
      const reply = await response.json();
      if (reply.received !== true || !/^[a-f0-9]{32}$/.test(reply.receipt)) throw new Error('Missing receipt');
      status.textContent = 'Responses received. Your receipt is ' + reply.receipt + '. You may close this page.';
    } catch {
      status.textContent = 'Receipt unavailable. Keep this page open and try again, or download a backup and return it to your researcher.';
    } finally {
      submit.disabled = false;
    }
  };
  backup.onclick = () => {
    const result = readResponse();
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result.data,null,2)],{type:'application/json'}));
    const link = document.createElement('a');
    link.href = url; link.download = result.filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url),5000);
  };
}

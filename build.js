'use strict';
const fs = require('fs');
const obj = require('./list.json');
const ical = require('ical-generator');
const countryList = require('country-list');
const cal = ical();
const year = 2019;
const items = [];
const duplicates = [];
let content = `# ${year} Web Development Conferences
A list of ${year} web development conferences.
A list of [${year - 1} conferences](https://github.com/ryanburgess/${year - 1}-conferences).

_**You can also add all conferences directly into your calendar by importing the \`.ics\` file into Google Calendar etc.**_

_**The \`.ics\` file can be downloaded [here](https://rawgit.com/ryanburgess/2019-conferences/master/2019-conferences.ics), but it's recommended to add it via URL (if your client supports that). Thus, you will dynamically get all updates.**_
`;
// create contributing instructions
const contribute =  `
## Contributing
1. Fork it
2. Create your feature branch (\`git checkout -b my-new-feature\`)
3. Add your conference to \`list.json\`
4. Run \`npm install\` to install local dependencies
5. Run \`npm run build\` to build the README and generate the .ics file
6. Commit your changes (\`git commit -am "Add some feature"\`)
7. Push to the branch (\`git push origin my-new-feature\`)
8. Create new Pull Request
`;

// messages
const messages = {
  'success': {
    'updated': 'Updated conference list'
  },
  'fail': {
    'char': 'Must contain 5 characters. Format: mm-dd',
  }
}

// month names for date function
const monthNames = [
  "January", "February", "March",
  "April", "May", "June", "July",
  "August", "September", "October",
  "November", "December"
];

// human readable date function
let humanDate = ( from, to ) => {
  // to mm-dd
  let dayMonthTo = '', dayTo, toMonthName;
  if( to ) {
    let toArr = to.split('-');
    let eventTo = new Date( year, ( toArr[0] - 1 ), toArr[1] );
    let toMonthIndex = eventTo.getMonth();
    dayTo = eventTo.getDate();
    toMonthName = monthNames[toMonthIndex];
    dayMonthTo = ` - ${dayTo} ${toMonthName}`;
  }

  // from mm-dd
  let fromArr = from.split('-');
  let eventFrom = new Date( year, ( fromArr[0] - 1 ), fromArr[1] );
  let fromDay = eventFrom.getDate();
  let fromMonthIndex = eventFrom.getMonth();
  let fromMonthName = monthNames[fromMonthIndex];

  // default return
  const defaultReturn = `${fromDay} ${fromMonthName}${dayMonthTo}, ${year}`;

  // if same month, use single month name
  if( to ) {
    if( fromMonthName === toMonthName ) {
      return `${fromDay} - ${dayTo} ${fromMonthName}, ${year}`;
    } else {
      return defaultReturn;
    }
  } else {
    return defaultReturn;
  }

}

// sort object by dateFrom
obj.sort(function(a, b) {
  let aFromArr = a.dateFrom.split('-');
  let bFromArr = b.dateFrom.split('-');
  a = aFromArr[0] + aFromArr[1];
  b = bFromArr[0] + bFromArr[1];
  return a - b;
});

// rows
const rows = [];

// create heading for conference list
content += `
# Conference List
`;

Array.prototype.contains = function(obj) {
  let i = this.length;
  while (i--) {
    if (this[i] == obj) {
        return true;
    }
  }
  return false;
}

// create list of conferences
for (const conference of obj) {
  if(!items.contains(conference.title)){
    items.push(conference.title);
    const country = String(conference.country).trim();
    const code = country === 'USA' ? 'us' :
     country === 'Great Britain' ? 'gb' : 
     countryList.getCode(country) ? String(countryList.getCode(country).toLowerCase()) : '';

    const flag = code.length === 2 ? `<img src="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.2.1/flags/4x3/${code}.svg" height="16" alt="${conference.country}" />` : '';
    if( conference.dateFrom.length !== 5 ) process.exit( console.log(`${conference.title} - dateFrom: ${messages.fail.char}`) );
    if( conference.dateTo.length !== 0 && conference.dateTo.length !== 5 ) process.exit( console.log(`${conference.title} - dateTo: ${messages.fail.char}`) );
    let humanReadableDate = humanDate( `${conference.dateFrom}`, `${conference.dateTo}` );

    rows.push([
      `[${conference.title}](${conference.url})`,
      humanReadableDate,
      `${flag} ${countryList.getName(code)}, ${conference.where}`,
    ]);
  }
}

content += `
| Conference | Date | Where |
|------------|------|-------|
`;
content += rows.map(cols => `| ${cols.join(' | ')} |`).join('\n');
content += '\n';

// add contribute information after list of conferences
content += contribute;

// create README with the list of conferences
fs.writeFile('./README.md', content, function (err) {
  if (err) throw err;
  console.log( messages.success.updated );
});

// create ical file
obj.forEach(event => {
  cal.createEvent({
    start: new Date(`${event.dateFrom}-${year}`),
    end: new Date(`${event.dateTo ? event.dateTo : event.dateFrom}-${year}`),
    summary: event.title,
    description: event.url,
    location: event.where,
  });
});

const outputCal = cal.toString();
const outputFile = `${year}-conferences.ics`;
fs.writeFile(outputFile, outputCal, (err) => {
  console.log(err ? err : `Exported all ${year} conferences into ${outputFile}. This file can be imported from any calendar like Google Calendar.`)
});

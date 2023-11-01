import * as fs from 'fs';
import csvParser from 'csv-parser';

const inputCSV = 'test-frag.csv';
const outputJSON = 'output.json';

const jsonArray = { list: [] };

async function main() {

    fs.createReadStream(inputCSV)
        .pipe(csvParser())
        .on('data', (row) => {
            console.log(row)
            jsonArray.list.push({
                wallet: row.wallet,
                amount: parseInt(row.amount)
            });
        })
        .on('end', () => {
            fs.writeFileSync(outputJSON, JSON.stringify(jsonArray, null, 2));
            console.log(`JSON data written to ${outputJSON}`);
        });

}

main()

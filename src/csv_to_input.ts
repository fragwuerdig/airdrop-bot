import * as fs from 'fs';
import csvParser from 'csv-parser';

const jsonArray = { list: [] };

async function main() {

    const inputCSV = process.argv[2]
    const outputJSON = process.argv[3]

    if ( !inputCSV || !outputJSON ) {
        console.log("please provide input CSV file and output JSON file names")
        return
    }

    fs.createReadStream(inputCSV)
        .pipe(csvParser())
        .on('data', (row) => {
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

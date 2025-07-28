import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { RadioAssessment, Cadet, AssessmentCohort } from '@prisma/client';

type AssessmentWithCadet = (RadioAssessment & { cadet: Cadet });

type CohortDetails = (AssessmentCohort & {
    assessments: AssessmentWithCadet[];
});

const criteriaKeys: (keyof RadioAssessment)[] = [
    'firstClassLogbookCompleted',
    'basicCyberSecurityVideoWatched',
    'correctUseOfBothFullCallsigns',
    'authenticateRequested',
    'authenticateAnsweredCorrectly',
    'radioCheckRequested',
    'radioCheckAnsweredCorrectly',
    'tacticalMessageFullyAnswered',
    'iSayAgainUsedCorrectly',
    'sayAgainUsed',
    'prowordKnowledgeCompletedOK',
    'securityKnowledgeCompletedOK',
    'generalOperatingAndConfidence',
    'passFail',
];

export async function generateAssessmentPdf(cohort: CohortDetails) {
    const passedCadets = cohort.assessments.filter(a => a.passFail);

    if (passedCadets.length === 0) {
        alert("No cadets have been marked as 'Pass'. PDF will not be generated.");
        return;
    }

    const formUrl = '/BRO Assessment Results Multi.pdf';
    const formPdfBytes = await fetch(formUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(formPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const [firstPage] = pages;
    const { height } = firstPage.getSize();

    const drawText = (page: any, text: string, x: number, y: number, size = 8) => {
        // pdf-lib uses a bottom-left origin, so we subtract y from the page height
        page.drawText(text || '', { x, y: height - y, size, font, color: rgb(0, 0, 0) });
    };

    const drawCheck = (page: any, x: number, y: number) => {
        page.drawText('X', { x, y: height - y, size: 10, font, color: rgb(0, 0, 0) });
    };

    // --- Meticulously Re-calculated Coordinates based on the new PDF ---
    const startY = 228;
    const rowHeight = 27.8;
    const checkboxStartX = 399.5;
    const checkboxSpacing = 22.5;

    for (let i = 0; i < passedCadets.length; i++) {
        const cadetAssessment = passedCadets[i];
        const { cadet } = cadetAssessment;
        const pageIndex = Math.floor(i / 10);
        const rowIndex = i % 10;
        
        if (pageIndex >= pages.length) break;

        const page = pages[pageIndex];
        const y = startY + (rowIndex * rowHeight);

        // Fill in cadet details
        drawText(page, (i + 1).toString(), 39, y, 9);
        drawText(page, cadet.sqn, 84, y, 9);
        drawText(page, cadet.rank, 144, y, 9);
        drawText(page, cadet.fullName, 210, y, 9);

        // Fill in checkboxes
        criteriaKeys.forEach((key, index) => {
            if (cadetAssessment[key]) {
                const x = checkboxStartX + (index * checkboxSpacing);
                drawCheck(page, x, y + 2.5);
            }
        });
    }
    
    // Fill in instructor/assessor details on all pages
    pages.forEach(page => {
        drawText(page, cohort.instructorName, 205, 483, 9);
        drawText(page, cohort.instructorSqn, 385, 483, 9);
        drawText(page, cohort.assessorName, 205, 508, 9);
        drawText(page, cohort.assessorSqn, 385, 508, 9);
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `BRO_Assessment_${cohort.name.replace(/ /g, '_')}.pdf`);
}

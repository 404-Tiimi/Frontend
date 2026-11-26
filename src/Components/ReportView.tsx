import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  Typography,
  Card,
  ThemeProvider,
  createTheme,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BarChart } from '@mui/x-charts/BarChart';
import type { InquiryData } from '../types';
import { useParams } from 'react-router-dom';

// Sama tumma teema kuin InquiryView:ssä
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { paper: '#000' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

// Backendin palauttama vastaus (vain tarvittavat kentät)
type AnswerData = {
  id: number;
  answer: string;
  question: { id: number };
};



function ReportView() {
  const [inquiry, setInquiry] = useState<InquiryData | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

// useParams palauttaa osoitteen parametrit, esim. /report/3 → { id: "3" }
  const { id } = useParams();
  const inquiryId = Number(id);

  // Haetaan kysely ja vastaukset aina kun inquiryId muuttuu
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${apiUrl}inquiry/${inquiryId}`).then((r) => {
        if (!r.ok) throw new Error('Kyselyn haku epäonnistui');
        return r.json();
      }),
      fetch(`${apiUrl}answers`).then((r) => {
        if (!r.ok) throw new Error('Vastausten haku epäonnistui');
        return r.json();
      }),
    ])
      .then(([inquiryData, answerData]: [InquiryData | null, AnswerData[]]) => {
        if (!inquiryData) throw new Error('Kyselyä ei löytynyt');
        setInquiry(inquiryData);
        setAnswers(answerData);
      })
      .catch((err: Error) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [inquiryId]);

  // Haetaan tietyn kysymyksen vastaukset (tyhjät jätetään pois)
  const answersFor = (questionId: number) =>
    answers.filter((a) => a.question?.id === questionId && a.answer?.trim());

  return (
    <ThemeProvider theme={darkTheme}>
      <Card sx={{ minWidth: 275 }}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && inquiry && (
            <>
              <Typography variant="h4" component="h1" gutterBottom>
                {inquiry.title} – raportti
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {inquiry.description}
              </Typography>

              {inquiry.questions.map((q, index) => {
                const qAnswers = answersFor(q.id);
                return (
                  <Accordion key={q.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ flexGrow: 1 }}>
                        {index + 1}. {q.quest}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        {qAnswers.length} vastausta
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {qAnswers.length === 0 ? (
                        <Typography color="text.secondary">Ei vastauksia</Typography>
                      ) : q.type === 'RADIO' ? (
                        <BarChart
                          width={500}
                          height={300}
                          xAxis={[{ scaleType: 'band', data: q.options }]}
                          yAxis={[{ label: 'Vastausten määrä', min: 0, tickMinStep: 1 }]}
                          series={[
                            {
                              data: q.options.map(
                                (option) => qAnswers.filter((answer) => answer.answer === option).length,
                              ),
                              label: 'Vastauksia',
                            },
                          ]}
                        />
                      ) : (
                        <List dense>
                          {qAnswers.map((a, i) => (
                            <div key={a.id}>
                              {i > 0 && <Divider />}
                              <ListItem>
                                <ListItemText primary={a.answer} />
                              </ListItem>
                            </div>
                          ))}
                        </List>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </>
          )}
        </Container>
      </Card>
    </ThemeProvider>
  );
}

export default ReportView;

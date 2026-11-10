export type InquiryData = {

    id: number
    title: string
    description: string
    author: string
    createDate: string
    deadlineDate: string
    questions: {
        id: number
        quest: string
    }[]


}
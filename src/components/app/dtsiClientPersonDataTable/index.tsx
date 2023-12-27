'use client'
import { dtsiClientPersonDataTableColumns } from '@/components/app/dtsiClientPersonDataTable/columns'
import { DataTable } from '@/components/app/dtsiClientPersonDataTable/dataTable'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/useToast'
import { queryDTSIAllPeople } from '@/data/dtsi/queries/queryDTSIAllPeople'
import { fetchReq } from '@/utils/shared/fetchReq'
import { apiUrls } from '@/utils/shared/urls'
import { catchUnexpectedServerErrorAndTriggerToast } from '@/utils/web/toastUtils'
import _ from 'lodash'
import useSWR from 'swr'

export function useGetAllPeople(toast: ReturnType<typeof useToast>['toast']) {
  return useSWR(apiUrls.dtsiAllPeople(), url =>
    fetchReq(url)
      .then(res => res.json())
      .then(data => data as Awaited<ReturnType<typeof queryDTSIAllPeople>>)
      .catch(catchUnexpectedServerErrorAndTriggerToast(toast)),
  )
}
// TODO figure out what we want this to look like on mobile
export function DTSIClientPersonDataTable() {
  const { toast } = useToast()
  const { data, error } = useGetAllPeople(toast)
  return (
    <div className="container mx-auto py-10">
      {data ? (
        <DataTable columns={dtsiClientPersonDataTableColumns} data={data.people} />
      ) : (
        <div className="min-h-[578px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {_.times(5).map(x => (
                  <TableHead key={x}>
                    <Skeleton className="h-5 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {_.times(10).map(x => (
                <TableRow key={x}>
                  {_.times(5).map(y => (
                    <TableCell key={y}>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
